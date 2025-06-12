/**
 * @module DoubleRatchetConfig
 * @description
 * Provides the configuration interface for the Double Ratchet algorithm used in secure messaging protocols.
 * The configuration is applied in ...\team01\frontend\src\routes\chat\[chatId]\+page.svelte Line 37.
 */

export interface DoubleRatchetConfig {
    chainKeyUpdateFrequency: number; // e.g., update every message (1), or every N messages
    keyDerivationFunction: 'HKDF' | 'KDF2' | 'PBKDF2'; // Key derivation function to use
    kdfIterations: number; // Number of iterations for PBKDF2 or KDF2
    kdfHash: 'SHA-256' | 'SHA-512';
    messageKeyLength: number; // in bytes, e.g., 32 for 256-bit keys
    chainKeyLength: number; // in bytes
    rootKeyLength: number; // in bytes
    useTripleRatchet: boolean;
    tripleRatchetOptions?: {
        enable: boolean;
        // Denis: Add more triple ratchet-specific options here, I haven't figured out which ones are interesting for experiments yet
    };
    maxSkippedMessageKeys: number; // for out-of-order message handling
    // Denis: Add more options if needed
}

export const defaultDoubleRatchetConfig: DoubleRatchetConfig = {
    chainKeyUpdateFrequency: 1,
    keyDerivationFunction: 'HKDF',
    kdfIterations: 0, // Not used for HKDF, but can be used for KDF2 or PBKDF2
    kdfHash: 'SHA-256',
    messageKeyLength: 32,
    chainKeyLength: 32,
    rootKeyLength: 32,
    useTripleRatchet: false,
    tripleRatchetOptions: {
        enable: false,
    },
    maxSkippedMessageKeys: 50,
};