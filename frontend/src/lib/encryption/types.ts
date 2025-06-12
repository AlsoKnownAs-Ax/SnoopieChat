export interface KeyPair {
	publicKey: Uint8Array;
	privateKey: Uint8Array;
}

export interface IdentityKeyPair extends KeyPair {
	publicKey: Uint8Array;
	privateKey: Uint8Array;
}

export interface PreKeyBundle {
	identityKey: Uint8Array;
	signedPreKeyId: number;
	signedPreKey: Uint8Array;
	signedPreKeySignature: Uint8Array;
	preKeyId?: number;
	preKey?: Uint8Array;
}

export interface EncryptedMessage {
	id: string;
	senderId: string;
	recipientId: string;
	ciphertext: Uint8Array;
	messageType: MessageType;
	timestamp: number;
	deviceId: number;
}

export interface DecryptedMessage {
	id: string;
	senderId: string;
	recipientId: string;
	plaintext: string;
	timestamp: number;
	deviceId: number;
}

export enum MessageType {
	PREKEY_MESSAGE = 3,
	WHISPER_MESSAGE = 1
}

export interface SessionState {
	recipientId: string;
	deviceId: number;
	sessionData: Uint8Array;
	lastUsed: number;
}

export interface DoubleRatchetSession {
	rootKey: Uint8Array;
	chainKey: Uint8Array;
	sendingEphemeralKey: KeyPair;
	receivingEphemeralKey?: Uint8Array;
	messageKeys: Map<number, Uint8Array>;
	skippedKeys: Map<string, Uint8Array>;
	sendingChainLength: number;
	receivingChainLength: number;
	previousSendingChainLength: number;
	isDemoSession?: boolean; // Flag to prevent key evolution in demo mode
}

export interface StoredKey {
	id: string;
	keyData: Uint8Array;
	type: 'identity' | 'prekey' | 'signed-prekey' | 'session';
	deviceId: number;
	userId?: string;
	createdAt: number;
	expiresAt?: number;
}

export interface EncryptionConfig {
	maxSkippedMessageKeys: number;
	maxMessageKeyAge: number;
	preKeyRotationInterval: number;
	signedPreKeyRotationInterval: number;
}

export interface EncryptionMetrics {
	messagesEncrypted: number;
	messagesDecrypted: number;
	keyRotations: number;
	sessionEstablishments: number;
	averageEncryptionTime: number;
	averageDecryptionTime: number;
}
