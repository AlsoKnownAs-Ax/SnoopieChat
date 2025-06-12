import { jwkEquals, getJwkFingerprint } from './crypto-utils';
import { performECDH, generateEphemeralKeyPair, x3dhDeriveSharedSecret } from './x3dh';
import { defaultDoubleRatchetConfig } from './ratchet-config';
import type { DoubleRatchetConfig } from './ratchet-config';
import { strategies } from './kdf-strategies';
import type { KDFStrategy, KDFInput } from './kdf-strategies';
import {
	loadPrivateKey,
	loadSignedPrekeyPrivateKey,
	getRatchetState,
	storeRatchetState
} from './idb-storage';
import type { StoredSignedPrekey } from './idb-storage';

export interface RatchetStateOptions {
	rootKey: ArrayBuffer;
	DHs: CryptoKeyPair; // Our current DH key pair (sending)
	DHr: CryptoKey; // Their current DH public key (receiving)
	CKs: ArrayBuffer; // Sending chain key
	CKr: ArrayBuffer; // Receiving chain key
	Ns: number; // Number of messages sent in current sending chain
	Nr: number; // Number of messages received in current receiving chain
	PN: number; // Number of messages in previous sending chain
}

/**
 * Initializes the ratchet state for a contact.
 * @param config DoubleRatchetConfig - Configuration for the double ratchet protocol.
 * @param contactID number - Unique identifier for the contact.
 * @returns {Promise<void>} Initializes the ratchet state for the contact.
 */
export async function initializeRatchetState(
	config: DoubleRatchetConfig = defaultDoubleRatchetConfig,
	contactID: number
): Promise<void> {
	let ratchetState = await getRatchetState(config, contactID);
	if (!ratchetState) {
		// TODO: Fetch/generate the following keys for X3DH:
		const senderIdentityPrivateKey = await loadPrivateKey();
		const senderIdentityPublicKeyPair = /* TODO */ null; // Fetch public key from certificate through PKI
		const senderIdentityKeyPair: CryptoKeyPair = {
			privateKey: senderIdentityPrivateKey,
			publicKey: senderIdentityPublicKeyPair
		};
		const storedSignedPrekey: StoredSignedPrekey = await loadSignedPrekeyPrivateKey();
		const senderPreKeyPrivateKey = storedSignedPrekey.privateKey;
		const senderPreKeyPublicKey = /* TODO */ null; // Fetch public key from certificate through PKI
		const senderSignedPrekey: CryptoKeyPair = {
			privateKey: senderPreKeyPrivateKey,
			publicKey: senderPreKeyPublicKey
		};
		const recipientIdentityPublicKey = /* TODO */ null; // Need PKI interaction for this
		const recipientSignedPrekey = /* TODO */ null; // Need PKI interaction for this
		const config = defaultDoubleRatchetConfig;
		const kdfStrategy = strategies[config.keyDerivationFunction];
		if (!kdfStrategy) {
			throw new Error(`Unsupported key derivation function: ${config.keyDerivationFunction}`);
		}
		const rootKey = await x3dhDeriveSharedSecret(
			senderIdentityKeyPair,
			senderSignedPrekey,
			recipientIdentityPublicKey,
			recipientSignedPrekey,
			config,
			kdfStrategy
		);
		ratchetState = await initializeRatchetState(config, contactID);
		await storeRatchetState(ratchetState, contactID);
	}
}

export class RatchetState {
	rootKey: ArrayBuffer;
	DHs: CryptoKeyPair;
	DHr: CryptoKey;
	CKs: ArrayBuffer;
	CKr: ArrayBuffer;
	CKt?: ArrayBuffer; // Triple ratchet chain key (optional)
	Ns: number;
	Nr: number;
	PN: number;
	config: DoubleRatchetConfig;
	kdfStrategy: KDFStrategy;

	// Skipped message keys: Map<dhPub fingerprint, Map<Ns, messageKey>>
	private skippedMessageKeys: Map<string, Map<number, ArrayBuffer>> = new Map();

	constructor(
		options: RatchetStateOptions,
		config: DoubleRatchetConfig = defaultDoubleRatchetConfig
	) {
		this.rootKey = options.rootKey;
		this.DHs = options.DHs;
		this.DHr = options.DHr;
		this.CKs = options.CKs;
		this.CKr = options.CKr;
		this.Ns = options.Ns || 0;
		this.Nr = options.Nr || 0;
		this.PN = options.PN || 0;
		this.config = config;
		this.kdfStrategy = strategies[config.keyDerivationFunction];
		if (!this.kdfStrategy) {
			throw new Error(`Unsupported key derivation function: ${config.keyDerivationFunction}`);
		}
		// Remove zeroed CKt initialization; CKt will be derived in performDHRatchet if needed
	}

	private buildKDFInput(keyMaterial: ArrayBuffer, info: Uint8Array, length: number): KDFInput {
		return {
			keyMaterial,
			salt: new Uint8Array(this.config.chainKeyLength),
			info,
			length,
			iterations: this.config.kdfIterations,
			kdfHash: this.config.kdfHash
		};
	}

	private async deriveKey(input: KDFInput): Promise<ArrayBuffer> {
		// Use the configured KDF strategy to derive the key
		return await this.kdfStrategy.deriveKey(input);
	}

	// Store a skipped message key
	private async storeSkippedMessageKey(dhPub: JsonWebKey, Ns: number, key: ArrayBuffer) {
		const fp: string = await getJwkFingerprint(dhPub);
		if (!this.skippedMessageKeys.has(fp)) {
			this.skippedMessageKeys.set(fp, new Map());
		}
		const chain = this.skippedMessageKeys.get(fp)!;
		chain.set(Ns, key);
		// Enforce max skipped keys
		if (chain.size > (this.config.maxSkippedMessageKeys || 50)) {
			// Remove oldest
			const oldest = Array.from(chain.keys()).sort((a, b) => a - b)[0];
			chain.delete(oldest);
		}
	}

	// Try to retrieve and remove a skipped message key
	private async trySkippedMessageKey(
		dhPub: JsonWebKey,
		Ns: number
	): Promise<ArrayBuffer | undefined> {
		const fp = await getJwkFingerprint(dhPub);
		const chain = this.skippedMessageKeys.get(fp);
		if (chain && chain.has(Ns)) {
			const key = chain.get(Ns)!;
			chain.delete(Ns);
			return key;
		}
		return undefined;
	}

	/**
	 * Advance the sending chain key and derive a new message key.
	 * This method checks if the current sending chain key needs to be advanced based on the configured frequency.
	 * @returns { newCKs: ArrayBuffer; messageKey: ArrayBuffer }
	 */
	async advanceChainKeySending(): Promise<{ newCKs: ArrayBuffer; messageKey: ArrayBuffer }> {
		// Only advance if frequency matches
		if (this.Ns % this.config.chainKeyUpdateFrequency !== 0 && this.Ns !== 0) {
			this.Ns += 1;
			// Return current CKs and a dummy messageKey (or throw if not allowed)
			return { newCKs: this.CKs, messageKey: new ArrayBuffer(this.config.messageKeyLength) };
		}
		const info = new TextEncoder().encode('DoubleRatchetMessageKey');
		const length = this.config.chainKeyLength + this.config.messageKeyLength;
		const kdfInput: KDFInput = this.buildKDFInput(this.CKs, info, length);
		const derived = await this.deriveKey(kdfInput);
		const derivedBytes = new Uint8Array(derived);
		const newCKs = derivedBytes.slice(0, this.config.chainKeyLength).buffer;
		const messageKey = derivedBytes.slice(
			this.config.chainKeyLength,
			this.config.chainKeyLength + this.config.messageKeyLength
		).buffer;
		this.CKs = newCKs;
		this.Ns += 1;
		return { newCKs, messageKey };
	}

	/**
	 * Advance the receiving chain key and derive a new message key.
	 * This method checks if the current receiving chain key needs to be advanced based on the configured frequency.
	 * @returns { newCKr: ArrayBuffer; messageKey: ArrayBuffer }
	 */
	async advanceChainKeyReceiving() {
		if (this.Nr % this.config.chainKeyUpdateFrequency !== 0 && this.Nr !== 0) {
			this.Nr += 1;
			return { newCKr: this.CKr, messageKey: new ArrayBuffer(this.config.messageKeyLength) };
		}
		const info = new TextEncoder().encode('DoubleRatchetMessageKey');
		const length = this.config.chainKeyLength + this.config.messageKeyLength;
		const kdfInput: KDFInput = this.buildKDFInput(this.CKs, info, length);
		const derived = await this.deriveKey(kdfInput);
		const derivedBytes = new Uint8Array(derived);
		const newCKr = derivedBytes.slice(0, this.config.chainKeyLength).buffer;
		const messageKey = derivedBytes.slice(
			this.config.chainKeyLength,
			this.config.chainKeyLength + this.config.messageKeyLength
		).buffer;
		this.CKr = newCKr;
		this.Nr += 1;
		return { newCKr, messageKey };
	}

	/**
	 * Advance the triple ratchet chain key and derive a new message key.
	 * This method is only called if triple ratchet is enabled.
	 * @returns { newCKt: ArrayBuffer; tripleMessageKey: ArrayBuffer }
	 */
	async advanceChainKeyTriple(): Promise<{ newCKt: ArrayBuffer; tripleMessageKey: ArrayBuffer }> {
		if (!this.config.useTripleRatchet || !this.CKt) {
			throw new Error('Triple ratchet is not enabled or CKt is not initialized.');
		}
		const info = new TextEncoder().encode('TripleRatchetMessageKey');
		const length = this.config.chainKeyLength + this.config.messageKeyLength;
		const kdfInput: KDFInput = this.buildKDFInput(this.CKt, info, length);
		const derived = await this.deriveKey(kdfInput);
		const derivedBytes = new Uint8Array(derived);
		const newCKt = derivedBytes.slice(0, this.config.chainKeyLength).buffer;
		const tripleMessageKey = derivedBytes.slice(
			this.config.chainKeyLength,
			this.config.chainKeyLength + this.config.messageKeyLength
		).buffer;
		this.CKt = newCKt;
		return { newCKt, tripleMessageKey };
	}

	/**
	 * Perform the Diffie-Hellman ratchet.
	 * This method is called when the remote party provides a new DH public key.
	 * @param newDHr - The new DH public key from the remote party.
	 * @returns
	 */
	async performDHRatchet(newDHr: CryptoKey) {
		this.PN = this.Ns;
		this.DHr = newDHr;
		this.DHs = await generateEphemeralKeyPair();
		const dhResult = await performECDH(this.DHs, this.DHr);
		const info = new TextEncoder().encode('DoubleRatchetRootKey');
		// Derive enough key material for rootKey, CKs, CKr, and optionally CKt
		let totalLen = this.config.rootKeyLength + 2 * this.config.chainKeyLength;
		if (this.config.useTripleRatchet) {
			totalLen += this.config.chainKeyLength; // Add space for CKt
		}
		const kdfInput: KDFInput = this.buildKDFInput(dhResult, info, totalLen);
		const derived = await this.deriveKey(kdfInput);
		const derivedBytes = new Uint8Array(derived);
		this.rootKey = derivedBytes.slice(0, this.config.rootKeyLength).buffer;
		this.CKs = derivedBytes.slice(
			this.config.rootKeyLength,
			this.config.rootKeyLength + this.config.chainKeyLength
		).buffer;
		this.CKr = derivedBytes.slice(
			this.config.rootKeyLength + this.config.chainKeyLength,
			this.config.rootKeyLength + 2 * this.config.chainKeyLength
		).buffer;
		if (this.config.useTripleRatchet) {
			this.CKt = derivedBytes.slice(
				this.config.rootKeyLength + 2 * this.config.chainKeyLength,
				totalLen
			).buffer;
		}
		this.Ns = 0;
		this.Nr = 0;
		return {
			newRootKey: this.rootKey,
			newCKs: this.CKs,
			newCKr: this.CKr,
			newCKt: this.CKt,
			newDHs: this.DHs,
			newDHr: this.DHr,
			PN: this.PN,
			Ns: this.Ns,
			Nr: this.Nr
		};
	}

	/**
	 * Encrypt a plaintext message using the ratchet state.
	 * This method advances the sending chain key, derives a message key, and encrypts the plaintext using AES-GCM.
	 * @param plaintext - The plaintext message to encrypt.
	 * @returns { ciphertext: Uint8Array; header: any }
	 * @throws {Error} If encryption fails or if triple ratchet is enabled but CKt is not initialized.
	 */
	async ratchetEncrypt(plaintext: Uint8Array): Promise<{ ciphertext: Uint8Array; header: any }> {
		// 1. Advance the sending chain key to get a fresh message key
		const { messageKey } = await this.advanceChainKeySending();

		// 2. If triple ratchet is enabled, advance and mix in the triple ratchet key
		let finalMessageKey = messageKey;
		if (this.config.useTripleRatchet && this.CKt) {
			const { tripleMessageKey } = await this.advanceChainKeyTriple();
			// Mix the two keys using a KDF for safety
			const info = new TextEncoder().encode('RatchetEncryptMix');
			const kdfInput: KDFInput = this.buildKDFInput(
				tripleMessageKey,
				info,
				this.config.messageKeyLength
			);
			finalMessageKey = await this.deriveKey(kdfInput);
		}

		// 3. Encrypt the plaintext using AES-GCM with the message key
		const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
		const cryptoKey = await window.crypto.subtle.importKey(
			'raw',
			finalMessageKey,
			{ name: 'AES-GCM' },
			false,
			['encrypt']
		);
		const ciphertextBuffer = await window.crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			cryptoKey,
			plaintext
		);
		const ciphertext = new Uint8Array(ciphertextBuffer);

		// 4. Construct the header (include DHs public key, Ns, PN, and IV)
		const exportedDHPub = await window.crypto.subtle.exportKey('jwk', this.DHs.publicKey);
		const header = {
			dhPub: exportedDHPub,
			Ns: this.Ns,
			PN: this.PN,
			iv: Array.from(iv)
		};

		return { ciphertext, header };
	}

	/**
	 * Decrypt a ciphertext message using the ratchet state.
	 * This method parses the header, checks for skipped message keys if the message is out of order,
	 * performs the Diffie-Hellman ratchet if necessary, and decrypts the ciphertext using AES-GCM.
	 * @param ciphertext - The encrypted message to decrypt.
	 * @param header - The header containing the DH public key, Ns, PN, and IV.
	 * @returns {Promise<Uint8Array>} The decrypted plaintext message.
	 * @throws {Error} If decryption fails or if a skipped message key is not found for out-of-order messages.
	 */
	async ratchetDecrypt(ciphertext: Uint8Array, header: any): Promise<Uint8Array> {
		// 1. Parse header
		const { dhPub, Ns, PN, iv } = header;
		let finalMessageKey: ArrayBuffer | undefined;
		// 2. Only try skipped message key if Ns < this.Nr
		if (Ns < this.Nr) {
			const skippedKey = await this.trySkippedMessageKey(dhPub, Ns);
			if (skippedKey) {
				finalMessageKey = skippedKey;
			} else {
				throw new Error('Skipped message key not found for out-of-order message'); // Denis: Can be caught at higher level and displayed in UI if we want to
			}
		} else {
			// 2. Import sender's DH public key
			const importedDHPub = await window.crypto.subtle.importKey(
				'jwk',
				dhPub,
				{ name: 'ECDH', namedCurve: 'P-256' },
				true,
				[]
			);
			// 3. If DHr changed, perform DH ratchet
			const currentDHPubJWK = await window.crypto.subtle.exportKey('jwk', this.DHr);
			if (!jwkEquals(currentDHPubJWK, dhPub)) {
				await this.performDHRatchet(importedDHPub);
			}
			// 4.1. If message is ahead, derive and store skipped keys
			while (this.Nr < Ns) {
				const { messageKey: skippedMsgKey } = await this.advanceChainKeyReceiving();
				await this.storeSkippedMessageKey(dhPub, this.Nr - 1, skippedMsgKey);
			}
			// 4.2. Advance to current message key
			const { messageKey } = await this.advanceChainKeyReceiving();
			finalMessageKey = messageKey;
			// If triple ratchet is enabled, advance and mix in the triple ratchet key
			if (this.config.useTripleRatchet && this.CKt) {
				const { tripleMessageKey } = await this.advanceChainKeyTriple();
				const info = new TextEncoder().encode('RatchetEncryptMix');
				const kdfInput: KDFInput = this.buildKDFInput(
					tripleMessageKey,
					info,
					this.config.messageKeyLength
				);
				finalMessageKey = await this.deriveKey(kdfInput);
			}
		}
		// 5. Decrypt ciphertext using AES-GCM
		const cryptoKey = await window.crypto.subtle.importKey(
			'raw',
			finalMessageKey!,
			{ name: 'AES-GCM' },
			false,
			['decrypt']
		);
		const ivArr = new Uint8Array(iv);
		let plaintextBuffer;
		try {
			plaintextBuffer = await window.crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: ivArr },
				cryptoKey,
				ciphertext
			);
		} catch (e) {
			throw new Error('Decryption failed: ' + (e instanceof Error ? e.message : e));
		}
		return new Uint8Array(plaintextBuffer);
	}
}
