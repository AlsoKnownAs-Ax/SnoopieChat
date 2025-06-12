import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { SecureKeyStorage } from './key-storage.js';
import { DoubleRatchetProtocol } from './double-ratchet.js';
import { messageBus } from './message-bus.js';
import type {
	EncryptedMessage,
	DecryptedMessage,
	PreKeyBundle,
	EncryptionMetrics,
	EncryptionConfig,
	DoubleRatchetSession
} from './types.js';
import { CryptoUtils } from './crypto-utils.js';

export interface EncryptionState {
	isInitialized: boolean;
	deviceId: number | null;
	isUnlocked: boolean;
	metrics: EncryptionMetrics;
	error: string | null;
}

interface MessageStore {
	[conversationId: string]: {
		messages: DecryptedMessage[];
		lastActivity: number;
	};
}

export class EncryptionService {
	private keyStorage: SecureKeyStorage;
	private protocol: DoubleRatchetProtocol;
	private sessionRegistry: Map<string, number> = new Map(); // Track recipient -> deviceId mapping
	private currentUserId: string | null = null; // Track current user ID for message bus

	// Svelte stores for reactive state
	private _state: Writable<EncryptionState>;
	private _messages: Writable<MessageStore>;

	public readonly state: Readable<EncryptionState>;
	public readonly messages: Readable<MessageStore>;

	constructor(config?: Partial<EncryptionConfig>, dbName?: string) {
		this.keyStorage = new SecureKeyStorage(dbName);
		this.protocol = new DoubleRatchetProtocol(this.keyStorage, config);

		// Initialize stores
		this._state = writable<EncryptionState>({
			isInitialized: false,
			deviceId: null,
			isUnlocked: false,
			metrics: {
				messagesEncrypted: 0,
				messagesDecrypted: 0,
				keyRotations: 0,
				sessionEstablishments: 0,
				averageEncryptionTime: 0,
				averageDecryptionTime: 0
			},
			error: null
		});

		this._messages = writable<MessageStore>({});

		// Create readable stores
		this.state = derived(this._state, ($state) => $state);
		this.messages = derived(this._messages, ($messages) => $messages);

		// Update metrics periodically
		this.startMetricsUpdater();
	}

	/**
	 * Initialize the encryption service with a password
	 */
	async initialize(password: string, deviceId: number): Promise<void> {
		// Create a timeout promise
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Initialization timeout after 30 seconds')), 30000);
		});

		// Create the initialization promise
		const initPromise = this._doInitialize(password, deviceId);

		// Race between initialization and timeout
		try {
			await Promise.race([initPromise, timeoutPromise]);
		} catch (error) {
			console.error('EncryptionService: Initialization failed or timed out:', error);
			this._state.update((s) => ({
				...s,
				error: `Initialization failed: ${error}`
			}));
			throw error;
		}
	}

	private async _doInitialize(password: string, deviceId: number): Promise<void> {
		try {
			console.log('EncryptionService: Starting initialization...');
			this._state.update((s) => ({ ...s, error: null }));

			// Initialize key storage
			console.log('EncryptionService: Initializing key storage...');
			await this.keyStorage.initialize(password);
			console.log('EncryptionService: Key storage initialized successfully');

			// Initialize protocol
			console.log('EncryptionService: Initializing protocol...');
			await this.protocol.initialize(deviceId);
			console.log('EncryptionService: Protocol initialized successfully');

			this._state.update((s) => ({
				...s,
				isInitialized: true,
				isUnlocked: true,
				deviceId
			}));

			console.log('EncryptionService: Initialization completed successfully');
		} catch (error) {
			console.error('EncryptionService: Initialization failed:', error);
			throw error;
		}
	}

	/**
	 * Unlock the service with password (for existing setup)
	 */
	async unlock(password: string, deviceId: number): Promise<void> {
		try {
			this._state.update((s) => ({ ...s, error: null }));

			await this.keyStorage.initialize(password);

			this._state.update((s) => ({
				...s,
				isUnlocked: true,
				deviceId
			}));
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Unlock failed: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Lock the service
	 */
	lock(): void {
		this._state.update((s) => ({
			...s,
			isUnlocked: false,
			deviceId: null
		}));
	}

	/**
	 * Get pre-key bundle for key exchange
	 */
	async getPreKeyBundle(): Promise<PreKeyBundle> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		return await this.protocol.createPreKeyBundle(state.deviceId);
	}

	/**
	 * Establish a session with a recipient using their pre-key bundle
	 */
	async establishSession(recipientId: string, preKeyBundle: PreKeyBundle): Promise<void> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			// For now, assume recipient device ID is 1 (in a real app, this would come from the recipient)
			const recipientDeviceId = 1;
			await this.protocol.establishSession(
				recipientId,
				recipientDeviceId,
				preKeyBundle,
				state.deviceId
			);
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Failed to establish session: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Send an encrypted message
	 */
	async sendMessage(
		recipientId: string,
		plaintext: string,
		senderId: string
	): Promise<EncryptedMessage> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			// Get the recipient's device ID from our session registry
			const recipientDeviceId = this.sessionRegistry.get(recipientId);
			if (!recipientDeviceId) {
				throw new Error(
					`No session found for recipient ${recipientId}. Please establish a session first.`
				);
			}

			console.log(`Sending message to ${recipientId} with device ID: ${recipientDeviceId}`);

			const encryptedMessage = await this.protocol.encrypt(
				recipientId,
				recipientDeviceId,
				plaintext,
				senderId,
				state.deviceId // Pass sender's device ID
			);

			// Store the message in our local store as sent
			const conversationId = this.getConversationId(senderId, recipientId);
			this._messages.update((messages) => {
				if (!messages[conversationId]) {
					messages[conversationId] = { messages: [], lastActivity: Date.now() };
				}

				const decryptedMessage: DecryptedMessage = {
					id: encryptedMessage.id,
					senderId,
					recipientId,
					plaintext,
					timestamp: encryptedMessage.timestamp,
					deviceId: encryptedMessage.deviceId
				};

				messages[conversationId].messages.push(decryptedMessage);
				messages[conversationId].lastActivity = Date.now();

				return messages;
			});

			// Send message through the message bus for demo purposes
			messageBus.sendMessage(encryptedMessage);

			return encryptedMessage;
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Failed to send message: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Receive and decrypt a message
	 */
	async receiveMessage(encryptedMessage: EncryptedMessage): Promise<DecryptedMessage> {
		const state = this.getCurrentState();
		if (!state.isUnlocked) {
			throw new Error('Service not unlocked');
		}

		try {
			const decryptedMessage = await this.protocol.decrypt(encryptedMessage);

			// Store the message in our local store
			const conversationId = this.getConversationId(
				encryptedMessage.senderId,
				encryptedMessage.recipientId
			);

			this._messages.update((messages) => {
				if (!messages[conversationId]) {
					messages[conversationId] = { messages: [], lastActivity: Date.now() };
				}

				messages[conversationId].messages.push(decryptedMessage);
				messages[conversationId].lastActivity = Date.now();

				return messages;
			});

			return decryptedMessage;
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Failed to decrypt message: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Get messages for a conversation
	 */
	getConversationMessages(participantId: string, currentUserId: string): DecryptedMessage[] {
		const conversationId = this.getConversationId(currentUserId, participantId);
		const messages = this.getCurrentMessages();
		return messages[conversationId]?.messages || [];
	}

	/**
	 * Clear all messages for a conversation
	 */
	clearConversation(participantId: string, currentUserId: string): void {
		const conversationId = this.getConversationId(currentUserId, participantId);
		this._messages.update((messages) => {
			delete messages[conversationId];
			return messages;
		});
	}

	/**
	 * Clear all data
	 */
	async clearAllData(): Promise<void> {
		try {
			await this.keyStorage.clearAll();
			this._messages.set({});
			this._state.update((s) => ({
				...s,
				isInitialized: false,
				isUnlocked: false,
				deviceId: null,
				error: null
			}));
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Failed to clear data: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Export conversation data (for backup purposes)
	 */
	exportConversationData(participantId: string, currentUserId: string): string {
		const messages = this.getConversationMessages(participantId, currentUserId);
		return JSON.stringify(
			{
				participants: [currentUserId, participantId],
				messages: messages.map((m) => ({
					id: m.id,
					senderId: m.senderId,
					recipientId: m.recipientId,
					plaintext: m.plaintext,
					timestamp: m.timestamp
				})),
				exportedAt: Date.now()
			},
			null,
			2
		);
	}

	/**
	 * Get current encryption metrics
	 */
	getCurrentMetrics(): EncryptionMetrics {
		return this.protocol.getMetrics();
	}

	/**
	 * Add a session directly to the protocol (for demo purposes)
	 */
	addProtocolSession(sessionKey: string, session: DoubleRatchetSession): void {
		this.protocol.addSession(sessionKey, session);
	}

	/**
	 * Set up message bus for demo mode
	 */
	setupMessageBus(currentUserId: string): void {
		this.currentUserId = currentUserId;
		messageBus.subscribe(currentUserId, async (encryptedMessage) => {
			try {
				console.log(
					`${currentUserId}: Received encrypted message via message bus:`,
					encryptedMessage
				);
				const decryptedMessage = await this.receiveMessage(encryptedMessage);
				console.log(
					`${currentUserId}: Successfully decrypted message:`,
					decryptedMessage.plaintext
				);
			} catch (error) {
				console.error(`${currentUserId}: Failed to process received message:`, error);
			}
		});
	}

	/**
	 * Clean up message bus subscription
	 */
	cleanupMessageBus(): void {
		if (this.currentUserId) {
			messageBus.unsubscribe(this.currentUserId);
			this.currentUserId = null;
		}
	}

	/**
	 * Private helper methods
	 */
	private getCurrentState(): EncryptionState {
		let currentState: EncryptionState;
		this._state.subscribe((state) => {
			currentState = state;
		})();
		return currentState!;
	}

	private getCurrentMessages(): MessageStore {
		let currentMessages: MessageStore;
		this._messages.subscribe((messages) => {
			currentMessages = messages;
		})();
		return currentMessages!;
	}

	private getConversationId(userId1: string, userId2: string): string {
		return [userId1, userId2].sort().join('-');
	}

	private startMetricsUpdater(): void {
		setInterval(() => {
			const metrics = this.protocol.getMetrics();
			this._state.update((s) => ({ ...s, metrics }));
		}, 5000); // Update every 5 seconds
	}

	/**
	 * Create a test session for development (bypassing proper key exchange)
	 */
	async createTestSession(recipientId: string, recipientDeviceId: number = 1): Promise<void> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			// Create a simple pre-key bundle for testing
			const testPreKeyBundle: PreKeyBundle = {
				identityKey: new Uint8Array(32).fill(1), // Mock identity key
				signedPreKeyId: 1,
				signedPreKey: new Uint8Array(32).fill(2), // Mock signed pre-key
				signedPreKeySignature: new Uint8Array(64).fill(3), // Mock signature
				preKeyId: 1,
				preKey: new Uint8Array(32).fill(4) // Mock pre-key
			};

			// Establish session for sending TO the recipient
			await this.protocol.establishSession(
				recipientId,
				recipientDeviceId,
				testPreKeyBundle,
				state.deviceId
			);

			// Track the recipient device ID for this session
			this.sessionRegistry.set(recipientId, recipientDeviceId);
			console.log(
				`Test session established with ${recipientId}, tracked device ID: ${recipientDeviceId}`
			);
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Failed to create test session: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Create a receiving session for demo purposes (so we can decrypt messages from a sender)
	 */
	async createReceivingSession(senderId: string, senderDeviceId: number): Promise<void> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			// Create the same mock session that the sender would have created
			// This simulates having received the sender's session establishment
			const receivingSessionKey = `${senderId}-${senderDeviceId}`;
			console.log(`Creating receiving session with key: "${receivingSessionKey}"`);

			// Use the SAME mock key material that all demo sessions use
			// This ensures that the sender and receiver have compatible sessions
			const mockRootKey = new Uint8Array(32).fill(1);
			const mockChainKey = new Uint8Array(32).fill(2);
			const mockEphemeralKeyPair = {
				publicKey: new Uint8Array(32).fill(3),
				privateKey: new Uint8Array(32).fill(4)
			};

			const session: DoubleRatchetSession = {
				rootKey: mockRootKey,
				chainKey: mockChainKey,
				sendingChainLength: 0,
				receivingChainLength: 0,
				previousSendingChainLength: 0,
				sendingEphemeralKey: mockEphemeralKeyPair,
				receivingEphemeralKey: undefined,
				messageKeys: new Map(),
				skippedKeys: new Map()
			};

			// Add the session directly to the protocol's sessions map
			this.protocol.addSession(receivingSessionKey, session);
			console.log(`✓ Receiving session created with key: "${receivingSessionKey}"`);
		} catch (error) {
			console.error(`Failed to create receiving session: ${error}`);
			throw error;
		}
	}

	/**
	 * Create a static receiving session that uses the same key for all messages (demo only)
	 */
	async createStaticReceivingSession(senderId: string, senderDeviceId: number): Promise<void> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			const receivingSessionKey = `${senderId}-${senderDeviceId}`;
			console.log(`Creating STATIC receiving session with key: "${receivingSessionKey}"`);

			// Use a STATIC chain key that doesn't evolve - this prevents key mismatch
			const staticChainKey = new Uint8Array(32).fill(42); // Static key for demo
			const mockRootKey = new Uint8Array(32).fill(1);
			const mockEphemeralKeyPair = {
				publicKey: new Uint8Array(32).fill(3),
				privateKey: new Uint8Array(32).fill(4)
			};

			const session: DoubleRatchetSession = {
				rootKey: mockRootKey,
				chainKey: staticChainKey, // This won't change
				sendingChainLength: 0,
				receivingChainLength: 0,
				previousSendingChainLength: 0,
				sendingEphemeralKey: mockEphemeralKeyPair,
				receivingEphemeralKey: undefined,
				messageKeys: new Map(),
				skippedKeys: new Map()
			};

			this.protocol.addSession(receivingSessionKey, session);
			console.log(`✓ Static receiving session created with key: "${receivingSessionKey}"`);
		} catch (error) {
			console.error(`Failed to create static receiving session: ${error}`);
			throw error;
		}
	}

	/**
	 * Get pre-key bundle as exportable JSON (for testing with multiple browser tabs)
	 */
	async getExportablePreKeyBundle(): Promise<string> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			const preKeyBundle = await this.protocol.createPreKeyBundle(state.deviceId);

			// Convert Uint8Arrays to base64 for JSON serialization
			const exportableBundle = {
				identityKey: CryptoUtils.arrayBufferToBase64(preKeyBundle.identityKey),
				signedPreKeyId: preKeyBundle.signedPreKeyId,
				signedPreKey: CryptoUtils.arrayBufferToBase64(preKeyBundle.signedPreKey),
				signedPreKeySignature: CryptoUtils.arrayBufferToBase64(preKeyBundle.signedPreKeySignature),
				preKeyId: preKeyBundle.preKeyId,
				preKey: preKeyBundle.preKey
					? CryptoUtils.arrayBufferToBase64(preKeyBundle.preKey)
					: undefined,
				deviceId: state.deviceId
			};

			return JSON.stringify(exportableBundle, null, 2);
		} catch (error) {
			throw new Error(`Failed to get exportable pre-key bundle: ${error}`);
		}
	}

	/**
	 * Establish session from imported pre-key bundle JSON (for testing with multiple browser tabs)
	 */
	async establishSessionFromJSON(recipientId: string, preKeyBundleJSON: string): Promise<void> {
		const state = this.getCurrentState();
		if (!state.isUnlocked || !state.deviceId) {
			throw new Error('Service not unlocked');
		}

		try {
			const exportableBundle = JSON.parse(preKeyBundleJSON);

			// Convert base64 back to Uint8Arrays
			const preKeyBundle: PreKeyBundle = {
				identityKey: CryptoUtils.base64ToArrayBuffer(exportableBundle.identityKey),
				signedPreKeyId: exportableBundle.signedPreKeyId,
				signedPreKey: CryptoUtils.base64ToArrayBuffer(exportableBundle.signedPreKey),
				signedPreKeySignature: CryptoUtils.base64ToArrayBuffer(
					exportableBundle.signedPreKeySignature
				),
				preKeyId: exportableBundle.preKeyId,
				preKey: exportableBundle.preKey
					? CryptoUtils.base64ToArrayBuffer(exportableBundle.preKey)
					: undefined
			};

			await this.protocol.establishSession(
				recipientId,
				exportableBundle.deviceId,
				preKeyBundle,
				state.deviceId
			);

			// Track the recipient device ID for this session
			this.sessionRegistry.set(recipientId, exportableBundle.deviceId);
			console.log(
				`Session established with ${recipientId} using imported pre-key bundle, tracked device ID: ${exportableBundle.deviceId}`
			);
		} catch (error) {
			this._state.update((s) => ({
				...s,
				error: `Failed to establish session from JSON: ${error}`
			}));
			throw error;
		}
	}

	/**
	 * Create a benchmark session that allows self-loop encryption/decryption for performance testing
	 */
	async createBenchmarkSession(benchmarkId: string, deviceId: number): Promise<void> {
		console.log(`Creating benchmark session: ${benchmarkId}`);

		// Generate proper cryptographic key material
		const rootKey = crypto.getRandomValues(new Uint8Array(32));
		const initialChainKey = crypto.getRandomValues(new Uint8Array(32));
		const ephemeralKeyPair = {
			publicKey: crypto.getRandomValues(new Uint8Array(32)),
			privateKey: crypto.getRandomValues(new Uint8Array(32))
		};

		const benchmarkSession: DoubleRatchetSession = {
			rootKey,
			chainKey: initialChainKey,
			sendingChainLength: 0,
			receivingChainLength: 0,
			previousSendingChainLength: 0,
			sendingEphemeralKey: ephemeralKeyPair,
			receivingEphemeralKey: undefined,
			messageKeys: new Map(),
			skippedKeys: new Map()
		};

		// Create the session key in the expected format
		const sessionKey = `${benchmarkId}-${deviceId}`;

		// Add session to protocol for both sending and receiving
		this.protocol.addSession(sessionKey, benchmarkSession);

		console.log(`✓ Benchmark session created with key: ${sessionKey}`);
	}

	/**
	 * Encrypt a message using benchmark session (self-loop)
	 */
	async benchmarkEncrypt(
		benchmarkId: string,
		deviceId: number,
		message: string
	): Promise<EncryptedMessage> {
		return await this.protocol.encrypt(
			benchmarkId, // recipient (same as sender for self-loop)
			deviceId, // recipient device ID
			message, // plaintext
			benchmarkId, // sender (same as recipient for self-loop)
			deviceId // sender device ID
		);
	}

	/**
	 * Decrypt a message using benchmark session (self-loop)
	 */
	async benchmarkDecrypt(encryptedMessage: EncryptedMessage): Promise<DecryptedMessage> {
		return await this.protocol.decrypt(encryptedMessage);
	}
}

// Singleton instance for easy access
export const encryptionService = new EncryptionService();
