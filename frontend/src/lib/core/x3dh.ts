/**
 * @module
 * @description
 * Provides utility functions for X3DH (Extended Triple Diffie-Hellman) key exchange protocol.
 */

import type { config } from './config';
import { strategies } from './kdf-strategies';
import type { KDFStrategy, KDFInput } from './kdf-strategies';
import type { DoubleRatchetConfig } from './ratchet-config';

/**
 * Generates an ephemeral key pair for use in the X3DH protocol.
 * @returns {Promise<CryptoKeyPair>} A promise that resolves to a CryptoKeyPair containing the ephemeral key pair.
 */
export async function generateEphemeralKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveBits']
    );
}

/**
 * Exports a public key from a CryptoKey object in JWK format.
 * @param {CryptoKey} publicKey - The public key to export.
 * @returns {Promise<JsonWebKey>} A promise that resolves to the exported public key in JWK format.
 */
export async function exportEphemeralPublicKey(ephemeralKeyPair: CryptoKeyPair): Promise<JsonWebKey> {
    return await window.crypto.subtle.exportKey('jwk', ephemeralKeyPair.publicKey);
}

/**
 * Imports a public key from a JWK (JSON Web Key) format.
 * @param {JsonWebKey} jwk - The JWK to import.
 * @returns {Promise<CryptoKey>} A promise that resolves to the imported public key as a CryptoKey object.
 */
export async function importEphemeralPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveBits']
    );
}

/**
 * Signs a prekey (public key in JWK format) using the identity private key.
 * @param prekeyJwk - The prekey public key as a JWK to sign.
 * @param identityPrivateKey - The recipient's identity private key (CryptoKey).
 * @returns {Promise<ArrayBuffer>} The signature as an ArrayBuffer.
 */
export async function signPrekey(
    prekeyJwk: JsonWebKey,
    identityPrivateKey: CryptoKey,
    kdfHash: AlgorithmIdentifier
): Promise<ArrayBuffer> {

    // Canonicalize and encode the JWK for signing
    const canonical = JSON.stringify(
        Object.keys(prekeyJwk).sort().reduce((obj, key) => {
            obj[key] = (prekeyJwk as any)[key];
            return obj;
        }, {} as any)
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    // Sign using ECDSA with SHA-256 (assuming P-256 curve)
    return await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: kdfHash },
        identityPrivateKey,
        data
    );
}

/**
 * Verifies a signed prekey using the identity public key and the signature.
 * @param signedPrekeyJwk 
 * @param signature 
 * @param identityPublicKey 
 * @return {Promise<boolean>} A promise that resolves to true if the signature is valid, false otherwise.
 */
export async function verifySignedPrekey(
    signedPrekeyJwk: JsonWebKey,
    signature: ArrayBuffer,
    identityPublicKey: CryptoKey,
    kdfHash: AlgorithmIdentifier
): Promise<boolean> { 
    //canonicalize and encode the JWK for verification
    const canonical = JSON.stringify(
        Object.keys(signedPrekeyJwk).sort().reduce((obj, key) => {
            obj[key] = (signedPrekeyJwk as any)[key];
            return obj;
        }, {} as any)
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    // Verify signature
    return await window.crypto.subtle.verify(
        { name: 'ECDSA', hash: kdfHash },
        identityPublicKey,
        signature,
        data
    );
}

/**
 * Performs Elliptic Curve Diffie-Hellman (ECDH) key agreement.
 * @param {CryptoKeyPair} keyPair
 * @param {CryptoKey} recipientPublicKey
 * @returns {Promise<ArrayBuffer>} A promise that resolves to the derived shared secret as an ArrayBuffer.
 */
export async function performECDH(keyPair: CryptoKeyPair, recipientPublicKey: CryptoKey): Promise<ArrayBuffer> {
    return await window.crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: recipientPublicKey,
        },
        keyPair.privateKey,
        256
    );
}

// Internal: Performs ECDH and concatenation, not exported
async function x3dhKeyAgreement(
    senderIdentityKeyPair: CryptoKeyPair,
    senderEphemeralKeyPair: CryptoKeyPair,
    recipientIdentityPublicKey: CryptoKey,
    recipientSignedPrekey: CryptoKey,
): Promise<ArrayBuffer> {
    const dh1 = await performECDH(senderEphemeralKeyPair, recipientSignedPrekey);
    const dh2 = await performECDH(senderIdentityKeyPair, recipientSignedPrekey);
    const dh3 = await performECDH(senderEphemeralKeyPair, recipientIdentityPublicKey);
    // Concatenate DH results
    const dhConcat = new Uint8Array(
        dh1.byteLength + dh2.byteLength + dh3.byteLength
    );
    dhConcat.set(new Uint8Array(dh1), 0);
    dhConcat.set(new Uint8Array(dh2), dh1.byteLength);
    dhConcat.set(new Uint8Array(dh3), dh1.byteLength + dh2.byteLength);
    return dhConcat.buffer;
}

async function deriveKey(input: KDFInput, kdfStrategy: KDFStrategy): Promise<ArrayBuffer> {
    // Use the configured KDF strategy to derive the key
    return await kdfStrategy.deriveKey(input);
}

/**
 * Public: Performs X3DH key agreement and derives a symmetric key using HKDF.
 * @param {CryptoKeyPair} senderIdentityKeyPair - The sender's identity key pair.
 * @param {CryptoKeyPair} senderEphemeralKeyPair - The sender's ephemeral key pair.
 * @param {CryptoKey} recipientIdentityPublicKey - The recipient's identity public key.
 * @param {CryptoKey} recipientSignedPrekey - The recipient's signed prekey.
 * @param {DoubleRatchetConfig} config - The double ratchet configuration.
 * @param {KDFStrategy} kdfStrategy - The key derivation function strategy to use (e.g., PBKDF2, HKDF).
 * @returns {Promise<ArrayBuffer>} The derived symmetric key.
 */
export async function x3dhDeriveSharedSecret(
    senderIdentityKeyPair: CryptoKeyPair,
    senderEphemeralKeyPair: CryptoKeyPair,
    recipientIdentityPublicKey: CryptoKey,
    recipientSignedPrekey: CryptoKey,
    config: DoubleRatchetConfig,
    kdfStrategy: KDFStrategy 
): Promise<ArrayBuffer> {
    const rawSecret = await x3dhKeyAgreement(
        senderIdentityKeyPair,
        senderEphemeralKeyPair,
        recipientIdentityPublicKey,
        recipientSignedPrekey,
    );
    const kdfInput: KDFInput = {
        keyMaterial: rawSecret,
        salt: new Uint8Array(config.chainKeyLength),
        info: new Uint8Array(0), // No additional info for X3DH
        length: config.rootKeyLength,
        iterations: config.kdfIterations,
        kdfHash: config.kdfHash
    };

    return await deriveKey(kdfInput, kdfStrategy);
}



