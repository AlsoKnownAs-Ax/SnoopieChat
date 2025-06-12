/**
 * @module
 * @description
 * Provides key derivation functions (KDF) strategies for cryptographic operations.
 * Supports PBKDF2 and HKDF strategies for deriving keys from raw key material.
 */

type PBKDF2Input = {
    keyMaterial: ArrayBuffer;
    salt: Uint8Array;
    iterations: number;
    kdfHash: AlgorithmIdentifier;
};

type HKDFInput = {
    keyMaterial: ArrayBuffer;
    salt: Uint8Array;
    info: Uint8Array;
    length: number;
    kdfHash: AlgorithmIdentifier;
};

export type KDFInput = PBKDF2Input | HKDFInput;

export interface KDFStrategy {
    deriveKey(input: KDFInput): Promise<ArrayBuffer>;
}

export class PBKDF2Strategy implements KDFStrategy {
    async deriveKey(input: PBKDF2Input): Promise<ArrayBuffer> {
        const key = await window.crypto.subtle.importKey(
            'raw',
            input.keyMaterial,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        return await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: input.salt,
                iterations: input.iterations,
                hash: input.kdfHash
            },
            key,
            length * 8
        );
    }
}

export class HKDFStrategy implements KDFStrategy {
    async deriveKey(input: HKDFInput): Promise<ArrayBuffer> {
        const key = await window.crypto.subtle.importKey(
            'raw',
            input.keyMaterial, 
            { name: 'HKDF' }, 
            false, 
            ['deriveBits']
        );
        return await window.crypto.subtle.deriveBits(
            {
                name: 'HKDF',
                hash: input.kdfHash,
                salt: input.salt,
                info: input.info
            },
            key,
            length * 8
        );
    }
}

export const strategies: Record<string, KDFStrategy> = {
    PBKDF2: new PBKDF2Strategy(),
    HKDF: new HKDFStrategy(),
};