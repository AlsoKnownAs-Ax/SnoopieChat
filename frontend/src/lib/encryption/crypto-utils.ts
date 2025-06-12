import { randomBytes } from '@noble/hashes/utils';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { ed25519 } from '@noble/curves/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import type { KeyPair, IdentityKeyPair } from './types.js';

/**
 * Cryptographic utilities for double ratchet encryption
 */
export class CryptoUtils {
	/**
	 * Generate a new Ed25519 identity key pair for signing
	 */
	static generateIdentityKeyPair(): IdentityKeyPair {
		const privateKey = ed25519.utils.randomPrivateKey();
		const publicKey = ed25519.getPublicKey(privateKey);

		return {
			publicKey: new Uint8Array(publicKey),
			privateKey: new Uint8Array(privateKey)
		};
	}

	/**
	 * Generate a new X25519 key pair for ECDH
	 */
	static generateKeyPair(): KeyPair {
		const privateKey = x25519.utils.randomPrivateKey();
		const publicKey = x25519.getPublicKey(privateKey);

		return {
			publicKey: new Uint8Array(publicKey),
			privateKey: new Uint8Array(privateKey)
		};
	}

	/**
	 * Perform X25519 ECDH key agreement
	 */
	static calculateECDH(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
		try {
			const sharedSecret = x25519.getSharedSecret(privateKey, publicKey);
			return new Uint8Array(sharedSecret);
		} catch (error) {
			throw new Error(`ECDH calculation failed: ${error}`);
		}
	}

	/**
	 * Sign data with Ed25519 private key
	 */
	static sign(privateKey: Uint8Array, data: Uint8Array): Uint8Array {
		try {
			const signature = ed25519.sign(data, privateKey);
			return new Uint8Array(signature);
		} catch (error) {
			throw new Error(`Signing failed: ${error}`);
		}
	}

	/**
	 * Verify Ed25519 signature
	 */
	static verify(publicKey: Uint8Array, data: Uint8Array, signature: Uint8Array): boolean {
		try {
			return ed25519.verify(signature, data, publicKey);
		} catch (error) {
			console.error('Signature verification failed:', error);
			return false;
		}
	}

	/**
	 * Derive keys using HKDF-SHA256
	 */
	static deriveKeys(
		inputKeyMaterial: Uint8Array,
		salt: Uint8Array,
		info: Uint8Array,
		length: number
	): Uint8Array {
		try {
			return hkdf(sha256, inputKeyMaterial, salt, info, length);
		} catch (error) {
			throw new Error(`Key derivation failed: ${error}`);
		}
	}

	/**
	 * Generate secure random bytes
	 */
	static generateRandomBytes(length: number): Uint8Array {
		return randomBytes(length);
	}

	/**
	 * Hash data with SHA-256
	 */
	static hash(data: Uint8Array): Uint8Array {
		return sha256(data);
	}

	/**
	 * Derive root key and chain key from shared secret
	 */
	static deriveRootKey(
		rootKey: Uint8Array,
		dhOutput: Uint8Array
	): { newRootKey: Uint8Array; chainKey: Uint8Array } {
		const salt = new Uint8Array(32); // Zero salt
		const info = new TextEncoder().encode('WhisperRatchet');
		const keyMaterial = this.deriveKeys(dhOutput, salt, info, 64);

		return {
			newRootKey: keyMaterial.slice(0, 32),
			chainKey: keyMaterial.slice(32, 64)
		};
	}

	/**
	 * Derive message key from chain key
	 */
	static deriveMessageKey(chainKey: Uint8Array): {
		messageKey: Uint8Array;
		nextChainKey: Uint8Array;
	} {
		const messageKeyInput = new Uint8Array([...chainKey, 0x01]);
		const chainKeyInput = new Uint8Array([...chainKey, 0x02]);

		return {
			messageKey: this.hash(messageKeyInput),
			nextChainKey: this.hash(chainKeyInput)
		};
	}

	/**
	 * Encrypt data using AES-256-GCM
	 */
	static async encryptAESGCM(
		plaintext: Uint8Array,
		key: Uint8Array,
		iv: Uint8Array,
		additionalData?: Uint8Array
	): Promise<{ ciphertext: Uint8Array; tag: Uint8Array }> {
		const keyBuffer = new ArrayBuffer(key.length);
		new Uint8Array(keyBuffer).set(key);

		const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, [
			'encrypt'
		]);

		const ivBuffer = new ArrayBuffer(iv.length);
		new Uint8Array(ivBuffer).set(iv);

		const plaintextBuffer = new ArrayBuffer(plaintext.length);
		new Uint8Array(plaintextBuffer).set(plaintext);

		const encrypted = await crypto.subtle.encrypt(
			{
				name: 'AES-GCM',
				iv: ivBuffer,
				additionalData: additionalData ? new Uint8Array(additionalData) : undefined
			},
			cryptoKey,
			plaintextBuffer
		);

		const encryptedArray = new Uint8Array(encrypted);
		const ciphertext = encryptedArray.slice(0, -16);
		const tag = encryptedArray.slice(-16);

		return { ciphertext, tag };
	}

	/**
	 * Decrypt data using AES-256-GCM
	 */
	static async decryptAESGCM(
		ciphertext: Uint8Array,
		tag: Uint8Array,
		key: Uint8Array,
		iv: Uint8Array,
		additionalData?: Uint8Array
	): Promise<Uint8Array> {
		const keyBuffer = new ArrayBuffer(key.length);
		new Uint8Array(keyBuffer).set(key);

		const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, [
			'decrypt'
		]);

		const combined = new Uint8Array(ciphertext.length + tag.length);
		combined.set(ciphertext);
		combined.set(tag, ciphertext.length);

		const combinedBuffer = new ArrayBuffer(combined.length);
		new Uint8Array(combinedBuffer).set(combined);

		const ivBuffer = new ArrayBuffer(iv.length);
		new Uint8Array(ivBuffer).set(iv);

		let additionalDataBuffer: ArrayBuffer | undefined;
		if (additionalData) {
			additionalDataBuffer = new ArrayBuffer(additionalData.length);
			new Uint8Array(additionalDataBuffer).set(additionalData);
		}

		const decrypted = await crypto.subtle.decrypt(
			{
				name: 'AES-GCM',
				iv: ivBuffer,
				additionalData: additionalDataBuffer
			},
			cryptoKey,
			combinedBuffer
		);

		return new Uint8Array(decrypted);
	}

	/**
	 * Constant-time comparison of two arrays
	 */
	static constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
		if (a.length !== b.length) {
			return false;
		}

		let result = 0;
		for (let i = 0; i < a.length; i++) {
			result |= a[i] ^ b[i];
		}

		return result === 0;
	}

	/**
	 * Convert Uint8Array to base64 string
	 */
	static arrayBufferToBase64(buffer: Uint8Array): string {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	/**
	 * Convert base64 string to Uint8Array
	 */
	static base64ToArrayBuffer(base64: string): Uint8Array {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}
}
