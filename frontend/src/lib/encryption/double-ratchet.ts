import { CryptoUtils } from './crypto-utils.js';
import { SecureKeyStorage } from './key-storage.js';
import type {
	KeyPair,
	IdentityKeyPair,
	PreKeyBundle,
	EncryptedMessage,
	DecryptedMessage,
	DoubleRatchetSession,
	EncryptionConfig,
	EncryptionMetrics
} from './types.js';
import { MessageType } from './types.js';

export class DoubleRatchetProtocol {
	private keyStorage: SecureKeyStorage;
	private config: EncryptionConfig;
	private metrics: EncryptionMetrics;
	private sessions: Map<string, DoubleRatchetSession> = new Map();

	constructor(keyStorage: SecureKeyStorage, config?: Partial<EncryptionConfig>) {
		this.keyStorage = keyStorage;
		this.config = {
			maxSkippedMessageKeys: 1000,
			maxMessageKeyAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			preKeyRotationInterval: 24 * 60 * 60 * 1000, // 1 day
			signedPreKeyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
			...config
		};
		this.metrics = {
			messagesEncrypted: 0,
			messagesDecrypted: 0,
			keyRotations: 0,
			sessionEstablishments: 0,
			averageEncryptionTime: 0,
			averageDecryptionTime: 0
		};
	}

	/**
	 * Initialize the protocol for a specific device
	 */
	async initialize(deviceId: number): Promise<void> {
		try {
			// Generate identity key pair if not exists
			let identityKeyPair = await this.keyStorage.getIdentityKeyPair(deviceId);
			if (!identityKeyPair) {
				console.log('Identity key pair not found, generating new one...');
				identityKeyPair = CryptoUtils.generateIdentityKeyPair();
				console.log('Generated identity key pair, storing...');
				await this.keyStorage.storeIdentityKeyPair(identityKeyPair, deviceId);
				console.log('Stored identity key pair, verifying...');

				// Verify the key was stored correctly
				const verifyKeyPair = await this.keyStorage.getIdentityKeyPair(deviceId);
				if (!verifyKeyPair) {
					throw new Error('Failed to store identity key pair');
				}
				console.log('Identity key pair verified successfully');
			} else {
				console.log('Using existing identity key pair');
			}

			// Generate initial pre-keys
			console.log('Generating pre-keys...');
			await this.generatePreKeys(deviceId, 10);

			// Generate signed pre-key
			console.log('Generating signed pre-key...');
			await this.generateSignedPreKey(deviceId);

			console.log('Protocol initialization completed successfully');
		} catch (error) {
			console.error('Protocol initialization failed:', error);
			throw new Error(`Failed to initialize protocol: ${error}`);
		}
	}

	/**
	 * Create a pre-key bundle for key exchange
	 */
	async createPreKeyBundle(deviceId: number): Promise<PreKeyBundle> {
		const identityKeyPair = await this.keyStorage.getIdentityKeyPair(deviceId);
		if (!identityKeyPair) {
			throw new Error('Identity key pair not found');
		}

		// Get a signed pre-key
		const signedPreKeyData = await this.keyStorage.getSignedPreKey(1, deviceId);
		if (!signedPreKeyData) {
			throw new Error('Signed pre-key not found');
		}

		// Get a one-time pre-key (optional)
		const preKeyData = await this.keyStorage.getPreKey(1, deviceId);

		return {
			identityKey: identityKeyPair.publicKey,
			signedPreKeyId: 1,
			signedPreKey: signedPreKeyData.keyPair.publicKey,
			signedPreKeySignature: signedPreKeyData.signature,
			preKeyId: preKeyData ? 1 : undefined,
			preKey: preKeyData?.publicKey
		};
	}

	/**
	 * Encrypt a message for a recipient
	 */
	async encrypt(
		recipientId: string,
		recipientDeviceId: number,
		plaintext: string,
		senderId: string,
		senderDeviceId: number
	): Promise<EncryptedMessage> {
		const startTime = performance.now();

		try {
			const sessionKey = `${recipientId}-${recipientDeviceId}`;
			console.log(`Looking for session with key: "${sessionKey}"`);
			console.log(`Available session keys:`, Array.from(this.sessions.keys()));
			console.log(`Total sessions: ${this.sessions.size}`);

			let session = this.sessions.get(sessionKey);

			if (!session) {
				console.error(`No session found for key: "${sessionKey}"`);
				throw new Error('No session found for recipient');
			}

			console.log(`Session found for ${recipientId}, encrypting message`);
			console.log(`ENCRYPT: Session chain key:`, Array.from(session.chainKey.slice(0, 8)), '...');
			console.log(`ENCRYPT: Is demo session:`, session.isDemoSession);

			// Derive message key
			const { messageKey, nextChainKey } = CryptoUtils.deriveMessageKey(session.chainKey);
			console.log(`ENCRYPT: Derived message key:`, Array.from(messageKey.slice(0, 8)), '...');

			// Only evolve keys if not a demo session
			if (!session.isDemoSession) {
				session.chainKey = nextChainKey;
				session.sendingChainLength++;
			}

			// Encrypt message
			const plaintextData = new TextEncoder().encode(plaintext);
			const iv = CryptoUtils.generateRandomBytes(12);
			// Use sender-senderDeviceId as additionalData (consistent with decryption)
			const additionalData = new TextEncoder().encode(`${senderId}-${senderDeviceId}`);
			const { ciphertext, tag } = await CryptoUtils.encryptAESGCM(
				plaintextData,
				messageKey,
				iv,
				additionalData
			);

			// Combine IV, ciphertext, and tag
			const messageData = new Uint8Array(iv.length + ciphertext.length + tag.length);
			messageData.set(iv, 0);
			messageData.set(ciphertext, iv.length);
			messageData.set(tag, iv.length + ciphertext.length);

			this.metrics.messagesEncrypted++;

			return {
				id: crypto.randomUUID(),
				senderId,
				recipientId,
				ciphertext: messageData,
				messageType: MessageType.WHISPER_MESSAGE,
				timestamp: Date.now(),
				deviceId: senderDeviceId // ← Use sender's device ID, not recipient's
			};
		} finally {
			const endTime = performance.now();
			this.updateMetrics('encryption', endTime - startTime);
		}
	}

	/**
	 * Decrypt a message from a sender
	 */
	async decrypt(encryptedMessage: EncryptedMessage): Promise<DecryptedMessage> {
		const startTime = performance.now();

		try {
			const sessionKey = `${encryptedMessage.senderId}-${encryptedMessage.deviceId}`;
			console.log(`Looking for decrypt session with key: "${sessionKey}"`);
			console.log(`Available session keys for decrypt:`, Array.from(this.sessions.keys()));
			console.log(`Total sessions for decrypt: ${this.sessions.size}`);

			let session = this.sessions.get(sessionKey);

			if (!session) {
				console.error(`Decrypt failed: No session found for key "${sessionKey}"`);
				console.error(`Available sessions:`, Array.from(this.sessions.keys()));
				throw new Error('No session found for sender');
			}

			console.log(`Session found for ${encryptedMessage.senderId}, decrypting message`);
			console.log(`DECRYPT: Session chain key:`, Array.from(session.chainKey.slice(0, 8)), '...');
			console.log(`DECRYPT: Is demo session:`, session.isDemoSession);

			// Extract IV and ciphertext
			const messageData = encryptedMessage.ciphertext;
			const iv = messageData.slice(0, 12);
			const ciphertext = messageData.slice(12, -16); // Everything except IV and tag
			const tag = messageData.slice(-16); // Last 16 bytes

			// Derive message key
			const { messageKey, nextChainKey } = CryptoUtils.deriveMessageKey(session.chainKey);
			console.log(`DECRYPT: Derived message key:`, Array.from(messageKey.slice(0, 8)), '...');

			// Only evolve keys if not a demo session
			if (!session.isDemoSession) {
				session.chainKey = nextChainKey;
			}

			// Decrypt message
			const decryptedData = await CryptoUtils.decryptAESGCM(
				ciphertext,
				tag,
				messageKey,
				iv,
				new TextEncoder().encode(`${encryptedMessage.senderId}-${encryptedMessage.deviceId}`)
			);
			const plaintext = new TextDecoder().decode(decryptedData);

			this.metrics.messagesDecrypted++;

			return {
				id: encryptedMessage.id,
				senderId: encryptedMessage.senderId,
				recipientId: encryptedMessage.recipientId,
				plaintext,
				timestamp: encryptedMessage.timestamp,
				deviceId: encryptedMessage.deviceId
			};
		} finally {
			const endTime = performance.now();
			this.updateMetrics('decryption', endTime - startTime);
		}
	}

	/**
	 * Get encryption metrics
	 */
	getMetrics(): EncryptionMetrics {
		return { ...this.metrics };
	}

	/**
	 * Add a session directly (for demo purposes)
	 */
	addSession(sessionKey: string, session: DoubleRatchetSession): void {
		this.sessions.set(sessionKey, session);
		console.log(`Session added with key: "${sessionKey}"`);
	}

	/**
	 * Private helper methods
	 */
	private async generatePreKeys(deviceId: number, count: number): Promise<void> {
		console.log(`Generating ${count} pre-keys...`);
		for (let i = 1; i <= count; i++) {
			console.log(`Generating pre-key ${i}/${count}`);
			const keyPair = CryptoUtils.generateKeyPair();
			await this.keyStorage.storePreKey(i, keyPair, deviceId);
		}
		console.log(`Successfully generated ${count} pre-keys`);
	}

	private async generateSignedPreKey(deviceId: number): Promise<void> {
		console.log('Retrieving identity key pair for signed pre-key generation...');
		const identityKeyPair = await this.keyStorage.getIdentityKeyPair(deviceId);
		if (!identityKeyPair) {
			throw new Error('Identity key pair not found');
		}

		console.log('Generating signed pre-key pair...');
		const keyPair = CryptoUtils.generateKeyPair();
		console.log('Signing pre-key...');
		const signature = CryptoUtils.sign(identityKeyPair.privateKey, keyPair.publicKey);
		console.log('Storing signed pre-key...');
		await this.keyStorage.storeSignedPreKey(1, keyPair, signature, deviceId);
		console.log('Signed pre-key stored successfully');
	}

	private updateMetrics(operation: string, duration: number): void {
		switch (operation) {
			case 'encryption':
				this.metrics.averageEncryptionTime =
					(this.metrics.averageEncryptionTime * (this.metrics.messagesEncrypted - 1) + duration) /
					this.metrics.messagesEncrypted;
				break;
			case 'decryption':
				this.metrics.averageDecryptionTime =
					(this.metrics.averageDecryptionTime * (this.metrics.messagesDecrypted - 1) + duration) /
					this.metrics.messagesDecrypted;
				break;
		}
	}

	/**
	 * Establish a session with a recipient using their pre-key bundle
	 */
	async establishSession(
		recipientId: string,
		deviceId: number,
		preKeyBundle: PreKeyBundle,
		ourDeviceId: number
	): Promise<void> {
		console.log(`Establishing session with ${recipientId} (device ${deviceId})`);

		try {
			// Get our identity key pair
			const ourIdentityKeyPair = await this.keyStorage.getIdentityKeyPair(ourDeviceId);
			if (!ourIdentityKeyPair) {
				throw new Error('Our identity key pair not found');
			}

			// Generate ephemeral key pair for this session
			const ephemeralKeyPair = CryptoUtils.generateKeyPair();

			// Perform X3DH key agreement
			// DH1 = Ecdh(IKa, SPKb)
			const dh1 = CryptoUtils.calculateECDH(
				ourIdentityKeyPair.privateKey,
				preKeyBundle.signedPreKey
			);

			// DH2 = Ecdh(EKa, IKb)
			const dh2 = CryptoUtils.calculateECDH(ephemeralKeyPair.privateKey, preKeyBundle.identityKey);

			// DH3 = Ecdh(EKa, SPKb)
			const dh3 = CryptoUtils.calculateECDH(ephemeralKeyPair.privateKey, preKeyBundle.signedPreKey);

			// DH4 = Ecdh(EKa, OPKb) - if one-time pre-key is available
			let dh4: Uint8Array | null = null;
			if (preKeyBundle.preKey) {
				dh4 = CryptoUtils.calculateECDH(ephemeralKeyPair.privateKey, preKeyBundle.preKey);
			}

			// Combine all DH outputs
			const dhOutputs = [dh1, dh2, dh3];
			if (dh4) {
				dhOutputs.push(dh4);
			}

			const combinedDH = new Uint8Array(dhOutputs.reduce((total, dh) => total + dh.length, 0));
			let offset = 0;
			for (const dh of dhOutputs) {
				combinedDH.set(dh, offset);
				offset += dh.length;
			}

			// Derive initial root key and chain key
			const salt = new Uint8Array(32); // Zero salt for simplicity
			const info = new TextEncoder().encode('WhisperRatchet');
			const keyMaterial = CryptoUtils.deriveKeys(combinedDH, salt, info, 64);

			const rootKey = keyMaterial.slice(0, 32);
			const chainKey = keyMaterial.slice(32, 64);

			// Create session
			const sessionKey = `${recipientId}-${deviceId}`;
			console.log(`Creating session with key: "${sessionKey}"`);

			const session: DoubleRatchetSession = {
				rootKey,
				chainKey,
				sendingChainLength: 0,
				receivingChainLength: 0,
				previousSendingChainLength: 0,
				sendingEphemeralKey: ephemeralKeyPair,
				receivingEphemeralKey: undefined,
				messageKeys: new Map(),
				skippedKeys: new Map()
			};

			this.sessions.set(sessionKey, session);
			console.log(`Session stored with key: "${sessionKey}"`);
			console.log(`Total sessions stored: ${this.sessions.size}`);
			console.log(`Session keys:`, Array.from(this.sessions.keys()));

			// Store session data
			const sessionData = new TextEncoder().encode(
				JSON.stringify({
					rootKey: CryptoUtils.arrayBufferToBase64(rootKey),
					chainKey: CryptoUtils.arrayBufferToBase64(chainKey),
					sendingChainLength: 0,
					receivingChainLength: 0,
					previousSendingChainLength: 0,
					sendingEphemeralKey: {
						publicKey: CryptoUtils.arrayBufferToBase64(ephemeralKeyPair.publicKey),
						privateKey: CryptoUtils.arrayBufferToBase64(ephemeralKeyPair.privateKey)
					}
				})
			);

			await this.keyStorage.storeSession(recipientId, deviceId, sessionData);
			console.log(`Session established successfully with ${recipientId}`);
		} catch (error) {
			console.error('Failed to establish session:', error);
			throw new Error(`Failed to establish session: ${error}`);
		}
	}
}
