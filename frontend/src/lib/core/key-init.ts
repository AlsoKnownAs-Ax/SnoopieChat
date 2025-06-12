/**
 * @module key-init
 * @description
 * Initializes cryptographic key pairs for secure messaging protocols.
 */

import { generateIdentityKeyPair } from './crypto-utils';
import { generateEphemeralKeyPair, signPrekey, exportEphemeralPublicKey } from './x3dh';
import { storePrivateKey, storeSignedPrekeyPrivateKey, loadPrivateKey } from './idb-storage';
import type { StoredSignedPrekey } from './idb-storage';
import { defaultDoubleRatchetConfig } from './ratchet-config';
import { PkiService } from './api-services';
import { toast } from 'svelte-sonner';

/**
 * Initializes the identity key pair by generating a new key pair and storing the private key.
 * @returns {Promise<CryptoKey>} The generated identity public key.
 * @throws {Error} If the key generation or storage fails.
 */
export async function initializeIdenetityKeyPair(): Promise<CryptoKey> {
	try {
		const keyPair = await generateIdentityKeyPair();
		await storePrivateKey(keyPair.privateKey);
		return keyPair.publicKey;
	} catch (error) {
		console.error('Failed to initialize identity key pair:', error);
		throw error;
	}
}

/**
 * Initializes a signed prekey pair by generating an ephemeral key pair, signing it with the identity private key, and storing the private key.
 * @returns {Promise<{ prekeyBundle: { prekeyJwk: JsonWebKey, signature: string, createdAt: string } }>} An object containing a prekeyBundle JSON for PKI.
 * @throws {Error} If any step in the process fails, such as key generation, signing, or storage.
 */
export async function initializeSignedPreKeyPair(username: string): Promise<void> {
	try {
		// 1. Generate ephemeral key pair (signed prekey)
		const preKeyPair = await generateEphemeralKeyPair();

		// 2. Add a timestamp for the prekey creation
		const createdAt = new Date().toISOString();

		// 3. Store the private key with the timestamp
		const signedPrekey: StoredSignedPrekey = {
			privateKey: preKeyPair.privateKey,
			createdAt
		};
		await storeSignedPrekeyPrivateKey(signedPrekey);

		// 4. Export the public key in JWK format
		const prekeyJwk = await exportEphemeralPublicKey(preKeyPair);

		// 5. Get identity private key for signing
		const identityPrivateKey = await loadPrivateKey();

		// 6. Sign the prekey JWK
		const signatureBuffer = await signPrekey(
			prekeyJwk,
			identityPrivateKey,
			defaultDoubleRatchetConfig.kdfHash
		);

		// 7. Convert signature to base64 for JSON transport (browser compatible)
		const signature = btoa(
			String.fromCharCode.apply(null, Array.from(new Uint8Array(signatureBuffer)))
		);

		// 8. Send prekeyBundle JSON to PKI
		const prekeyBundle = {
			username: username,
			prekeyJwk: prekeyJwk,
			signature,
			createdAt
		};

		try {
			console.log('prekeyBundle:', prekeyBundle);

			const response = await fetch('/api/uploadKeyBundle', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(prekeyBundle)
			});

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(errorData.error || 'Unexpected Error: Failed to upload key bundle');
				console.log('Error: ', errorData.error);
			}
		} catch (error) {
			console.error('Failed to upload key bundle:', error);
			throw error;
		}
	} catch (error) {
		console.error('Failed to initialize signed prekey pair:', error);
		throw error;
	}
}
