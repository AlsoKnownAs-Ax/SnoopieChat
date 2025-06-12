import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { CryptoUtils } from './crypto-utils.js';
import type { StoredKey, IdentityKeyPair, KeyPair } from './types.js';

interface EncryptionDBSchema extends DBSchema {
	keys: {
		key: string;
		value: {
			id: string;
			encryptedData: string;
			tag: string;
			iv: string;
			type: 'identity' | 'prekey' | 'signed-prekey' | 'session';
			deviceId: number;
			userId?: string;
			createdAt: number;
			expiresAt?: number;
		};
		indexes: {
			'by-type': string;
			'by-user': string;
			'by-device': number;
			'by-expiry': number;
		};
	};
	sessions: {
		key: string;
		value: {
			recipientId: string;
			deviceId: number;
			encryptedSessionData: string;
			tag: string;
			iv: string;
			lastUsed: number;
		};
		indexes: {
			'by-recipient': string;
			'by-last-used': number;
		};
	};
	metadata: {
		key: string;
		value: {
			key: string;
			masterKeyHash: string;
			version: number;
			createdAt: number;
		};
	};
}

export class SecureKeyStorage {
	private db: IDBPDatabase<EncryptionDBSchema> | null = null;
	private masterKey: Uint8Array | null = null;
	private readonly dbName: string;
	private readonly dbVersion = 2;

	constructor(dbName: string = 'EncryptionDB') {
		this.dbName = dbName;
	}

	/**
	 * Initialize the key storage with a master password
	 */
	async initialize(password: string): Promise<void> {
		try {
			// Derive master key from password
			this.masterKey = await this.deriveMasterKey(password);

			// Open or create database
			this.db = await openDB<EncryptionDBSchema>(this.dbName, this.dbVersion, {
				upgrade(db, oldVersion, newVersion) {
					console.log(`Upgrading database from version ${oldVersion} to ${newVersion || 'latest'}`);

					// For development, clear all existing data when upgrading
					if (oldVersion > 0 && newVersion && oldVersion < newVersion) {
						console.log('Clearing existing database data due to schema changes');
						// Delete existing object stores
						for (const storeName of db.objectStoreNames) {
							db.deleteObjectStore(storeName);
						}
					}

					// Create keys store
					console.log('Creating keys object store');
					const keysStore = db.createObjectStore('keys', { keyPath: 'id' });
					keysStore.createIndex('by-type', 'type');
					keysStore.createIndex('by-user', 'userId');
					keysStore.createIndex('by-device', 'deviceId');
					keysStore.createIndex('by-expiry', 'expiresAt');

					// Create sessions store
					console.log('Creating sessions object store');
					const sessionsStore = db.createObjectStore('sessions', {
						keyPath: ['recipientId', 'deviceId']
					});
					sessionsStore.createIndex('by-recipient', 'recipientId');
					sessionsStore.createIndex('by-last-used', 'lastUsed');

					// Create metadata store
					console.log('Creating metadata object store');
					db.createObjectStore('metadata', { keyPath: 'key' });
				}
			});

			await this.verifyOrSetMasterKey();
		} catch (error) {
			throw new Error(`Failed to initialize key storage: ${error}`);
		}
	}

	/**
	 * Store an identity key pair securely
	 */
	async storeIdentityKeyPair(keyPair: IdentityKeyPair, deviceId: number): Promise<void> {
		if (!this.db || !this.masterKey) {
			throw new Error('Key storage not initialized');
		}

		try {
			console.log('Storing identity key pair for device:', deviceId);

			const keyData = new Uint8Array(keyPair.publicKey.length + keyPair.privateKey.length);
			keyData.set(keyPair.publicKey, 0);
			keyData.set(keyPair.privateKey, keyPair.publicKey.length);

			const storedKey: StoredKey = {
				id: `identity-${deviceId}`,
				keyData,
				type: 'identity',
				deviceId,
				createdAt: Date.now()
			};

			await this.storeKey(storedKey);
			console.log('Identity key pair stored successfully');
		} catch (error) {
			console.error('Failed to store identity key pair:', error);
			throw error;
		}
	}

	/**
	 * Retrieve an identity key pair
	 */
	async getIdentityKeyPair(deviceId: number): Promise<IdentityKeyPair | null> {
		try {
			console.log('Retrieving identity key pair for device:', deviceId);

			const storedKey = await this.getKey(`identity-${deviceId}`);
			if (!storedKey || storedKey.type !== 'identity') {
				console.log('Identity key pair not found');
				return null;
			}

			const publicKeyLength = 32; // Ed25519 public key length
			const publicKey = storedKey.keyData.slice(0, publicKeyLength);
			const privateKey = storedKey.keyData.slice(publicKeyLength);

			console.log('Identity key pair retrieved successfully');
			return { publicKey, privateKey };
		} catch (error) {
			console.error('Failed to retrieve identity key pair:', error);
			return null;
		}
	}

	/**
	 * Store a pre-key
	 */
	async storePreKey(keyId: number, keyPair: KeyPair, deviceId: number): Promise<void> {
		const keyData = new Uint8Array(keyPair.publicKey.length + keyPair.privateKey.length);
		keyData.set(keyPair.publicKey, 0);
		keyData.set(keyPair.privateKey, keyPair.publicKey.length);

		const storedKey: StoredKey = {
			id: `prekey-${deviceId}-${keyId}`,
			keyData,
			type: 'prekey',
			deviceId,
			createdAt: Date.now(),
			expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
		};

		await this.storeKey(storedKey);
	}

	/**
	 * Get a pre-key
	 */
	async getPreKey(keyId: number, deviceId: number): Promise<KeyPair | null> {
		const storedKey = await this.getKey(`prekey-${deviceId}-${keyId}`);
		if (!storedKey || storedKey.type !== 'prekey') {
			return null;
		}

		const publicKeyLength = 32; // X25519 public key length
		const publicKey = storedKey.keyData.slice(0, publicKeyLength);
		const privateKey = storedKey.keyData.slice(publicKeyLength);

		return { publicKey, privateKey };
	}

	/**
	 * Store a signed pre-key
	 */
	async storeSignedPreKey(
		keyId: number,
		keyPair: KeyPair,
		signature: Uint8Array,
		deviceId: number
	): Promise<void> {
		const keyData = new Uint8Array(
			keyPair.publicKey.length + keyPair.privateKey.length + signature.length
		);
		keyData.set(keyPair.publicKey, 0);
		keyData.set(keyPair.privateKey, keyPair.publicKey.length);
		keyData.set(signature, keyPair.publicKey.length + keyPair.privateKey.length);

		const storedKey: StoredKey = {
			id: `signed-prekey-${deviceId}-${keyId}`,
			keyData,
			type: 'signed-prekey',
			deviceId,
			createdAt: Date.now(),
			expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
		};

		await this.storeKey(storedKey);
	}

	/**
	 * Get a signed pre-key
	 */
	async getSignedPreKey(
		keyId: number,
		deviceId: number
	): Promise<{ keyPair: KeyPair; signature: Uint8Array } | null> {
		const storedKey = await this.getKey(`signed-prekey-${deviceId}-${keyId}`);
		if (!storedKey || storedKey.type !== 'signed-prekey') {
			return null;
		}

		const publicKeyLength = 32;
		const privateKeyLength = 32;
		const publicKey = storedKey.keyData.slice(0, publicKeyLength);
		const privateKey = storedKey.keyData.slice(publicKeyLength, publicKeyLength + privateKeyLength);
		const signature = storedKey.keyData.slice(publicKeyLength + privateKeyLength);

		return {
			keyPair: { publicKey, privateKey },
			signature
		};
	}

	/**
	 * Store session data
	 */
	async storeSession(
		recipientId: string,
		deviceId: number,
		sessionData: Uint8Array
	): Promise<void> {
		if (!this.db || !this.masterKey) {
			throw new Error('Key storage not initialized');
		}

		const iv = CryptoUtils.generateRandomBytes(12);
		const sessionId = `${recipientId}-${deviceId}`;
		const { ciphertext, tag } = await CryptoUtils.encryptAESGCM(
			sessionData,
			this.masterKey,
			iv,
			new TextEncoder().encode(sessionId)
		);

		await this.db.put('sessions', {
			recipientId,
			deviceId,
			encryptedSessionData: CryptoUtils.arrayBufferToBase64(ciphertext),
			tag: CryptoUtils.arrayBufferToBase64(tag),
			iv: CryptoUtils.arrayBufferToBase64(iv),
			lastUsed: Date.now()
		});
	}

	/**
	 * Get session data
	 */
	async getSession(recipientId: string, deviceId: number): Promise<Uint8Array | null> {
		if (!this.db || !this.masterKey) {
			throw new Error('Key storage not initialized');
		}

		const sessionRecord = await this.db.get('sessions', IDBKeyRange.only([recipientId, deviceId]));
		if (!sessionRecord) {
			return null;
		}

		try {
			const ciphertext = CryptoUtils.base64ToArrayBuffer(sessionRecord.encryptedSessionData);
			const tag = CryptoUtils.base64ToArrayBuffer(sessionRecord.tag);
			const iv = CryptoUtils.base64ToArrayBuffer(sessionRecord.iv);
			const sessionId = `${recipientId}-${deviceId}`;

			const decrypted = await CryptoUtils.decryptAESGCM(
				ciphertext,
				tag,
				this.masterKey,
				iv,
				new TextEncoder().encode(sessionId)
			);

			// Update last used timestamp
			await this.db.put('sessions', {
				...sessionRecord,
				lastUsed: Date.now()
			});

			return decrypted;
		} catch (error) {
			console.error('Failed to decrypt session data:', error);
			return null;
		}
	}

	/**
	 * Remove expired keys
	 */
	async cleanupExpiredKeys(): Promise<void> {
		if (!this.db) {
			throw new Error('Key storage not initialized');
		}

		const now = Date.now();
		const tx = this.db.transaction('keys', 'readwrite');
		const index = tx.store.index('by-expiry');

		for await (const cursor of index.iterate(IDBKeyRange.upperBound(now))) {
			await cursor.delete();
		}
	}

	/**
	 * Clear all stored data
	 */
	async clearAll(): Promise<void> {
		if (!this.db) {
			throw new Error('Key storage not initialized');
		}

		const tx = this.db.transaction(['keys', 'sessions', 'metadata'], 'readwrite');
		await Promise.all([
			tx.objectStore('keys').clear(),
			tx.objectStore('sessions').clear(),
			tx.objectStore('metadata').clear()
		]);
	}

	/**
	 * Private helper methods
	 */
	private async deriveMasterKey(password: string): Promise<Uint8Array> {
		const encoder = new TextEncoder();
		const passwordData = encoder.encode(password);
		const salt = encoder.encode('DoubleRatchetSalt'); // In production, use a random salt

		return CryptoUtils.deriveKeys(passwordData, salt, encoder.encode('MasterKey'), 32);
	}

	private async verifyOrSetMasterKey(): Promise<void> {
		if (!this.db || !this.masterKey) {
			throw new Error('Database or master key not available');
		}

		const masterKeyHash = CryptoUtils.arrayBufferToBase64(CryptoUtils.hash(this.masterKey));
		const existing = await this.db.get('metadata', 'masterKey');

		if (existing) {
			if (existing.masterKeyHash !== masterKeyHash) {
				throw new Error('Invalid password');
			}
		} else {
			await this.db.put('metadata', {
				key: 'masterKey',
				masterKeyHash,
				version: this.dbVersion,
				createdAt: Date.now()
			});
		}
	}

	private async storeKey(storedKey: StoredKey): Promise<void> {
		if (!this.db || !this.masterKey) {
			throw new Error('Key storage not initialized');
		}

		try {
			console.log('Storing key with ID:', storedKey.id);

			const iv = CryptoUtils.generateRandomBytes(12);
			const { ciphertext, tag } = await CryptoUtils.encryptAESGCM(
				storedKey.keyData,
				this.masterKey,
				iv,
				new TextEncoder().encode(storedKey.id)
			);

			await this.db.put('keys', {
				id: storedKey.id,
				encryptedData: CryptoUtils.arrayBufferToBase64(ciphertext),
				tag: CryptoUtils.arrayBufferToBase64(tag),
				iv: CryptoUtils.arrayBufferToBase64(iv),
				type: storedKey.type,
				deviceId: storedKey.deviceId,
				userId: storedKey.userId,
				createdAt: storedKey.createdAt,
				expiresAt: storedKey.expiresAt
			});

			console.log('Key stored successfully with ID:', storedKey.id);
		} catch (error) {
			console.error('Failed to store key:', error);
			throw error;
		}
	}

	private async getKey(id: string): Promise<StoredKey | null> {
		if (!this.db || !this.masterKey) {
			throw new Error('Key storage not initialized');
		}

		try {
			console.log('Retrieving key with ID:', id);

			const record = await this.db.get('keys', id);
			if (!record) {
				console.log('Key not found with ID:', id);
				return null;
			}

			const ciphertext = CryptoUtils.base64ToArrayBuffer(record.encryptedData);
			const tag = CryptoUtils.base64ToArrayBuffer(record.tag);
			const iv = CryptoUtils.base64ToArrayBuffer(record.iv);

			const keyData = await CryptoUtils.decryptAESGCM(
				ciphertext,
				tag,
				this.masterKey,
				iv,
				new TextEncoder().encode(record.id)
			);

			console.log('Key retrieved successfully with ID:', id);

			return {
				id: record.id,
				keyData,
				type: record.type,
				deviceId: record.deviceId,
				userId: record.userId,
				createdAt: record.createdAt,
				expiresAt: record.expiresAt
			};
		} catch (error) {
			console.error('Failed to retrieve key:', error);
			return null;
		}
	}
}
