/**
 * @module crypto-utils
 * @description
 * Provides utility functions for cryptographic operations such as key generation, export, import, and comparison.
 * This module uses the Web Crypto API for cryptographic operations. 
 */


/**
 * Generates the identity key pair from IndexedDB.
 * @returns Promise<string | null> The identity key pair or null if not found.
 */
export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

export async function generateRSAPublicKey() {
	// Generate RSA key pair
	const keyPair = await window.crypto.subtle.generateKey(
		{
			name: 'RSASSA-PKCS1-v1_5',
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: 'SHA-256'
		},
		true,
		['sign', 'verify']
	);

	const publicKeyExported = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);

	// Convert to Base64
	const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyExported)));

	return publicKeyBase64;
}

/**
 * Exports the public key from a CryptoKey object.
 * @param publicKey - The public key to export.
 * @returns {Promise<JsonWebKey>} The exported public key in JWK format.
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<JsonWebKey> {
    return await window.crypto.subtle.exportKey('jwk', publicKey);
}

//exportKey(), importKey() encrypt(), decrypt() (e.g., AES-GCM) deriveKey() or kdf()

/**
 * Imports a public key from a JWK (JSON Web Key) format.
 * @param jwk - The JWK to import.
 * @returns {Promise<CryptoKey>} The imported public key as a CryptoKey object.
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        true,
        ['verify']
    );
  }


/**
 * 
 * Compares two JSON Web Keys (JWKs) for equality.
 * @param a - The first JWK to compare.
 * @param b - The second JWK to compare.
 * @returns 
 */
export async function jwkEquals(a: JsonWebKey, b: JsonWebKey): Promise<boolean> {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i++) {
        const key = aKeys[i];
        if (key !== bKeys[i]) return false;
        // Compare values as strings for simplicity
        if ((a as any)[key] !== (b as any)[key]) return false;
    }
    return true;
}

/**
 * Generates a fingerprint for a JSON Web Key (JWK) using SHA-256.
 * This function canonicalizes the JWK by sorting its keys, then hashes the JSON string representation
 * @param jwk - The JSON Web Key to generate a fingerprint for.
 * @returns {Promise<string>} A promise that resolves to the JWK fingerprint as a hex string.
 */
export async  function getJwkFingerprint(jwk: JsonWebKey): Promise<string> {
    // Canonicalize: sort keys
    const canonical = JSON.stringify(
        Object.keys(jwk).sort().reduce((obj, key) => {
            obj[key] = (jwk as any)[key];
            return obj;
        }, {} as any)
    );
    // Hash with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    // Convert to hex string
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

