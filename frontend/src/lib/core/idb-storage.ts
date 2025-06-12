/**
 * @module
 * @description
 * Provides utility functions for storing and retrieving cryptographic keys and states using IndexedDB.
 * This module uses the idb library for IndexedDB operations.
 */


import { openDB } from 'idb';
import { initializeRatchetState } from './ratchet';
import type { IDBPDatabase } from 'idb';
import type { DoubleRatchetConfig } from './ratchet-config';

// Type definitions for the stored signed prekey
export type StoredSignedPrekey = {
    privateKey: CryptoKey;
    createdAt: string;
};

// Configuration for the crypto storage
const DB_NAME = 'crypto-storage';
const STORE_NAME = 'keys';
const PRIVATE_KEY_ID = 'private-key'
const SIGNED_PREKEY_PRIVATE_ID = 'signed-prekey-private-key';
const RATCHET_STATE_ID = 'ratchet-state';

/**
 * Opens the IndexedDB database and returns the database instance.
 * Also creates the database and object stores if they do not exist.
 * @returns Promise<IDBDatabase>
 */

async function getDatabase(): Promise<IDBPDatabase<unknown>> {
    try {
        const db = await openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
        return db;
    } catch (error) {
        console.error('Error opening IndexedDB database:', error);
        throw new Error('Failed to open IndexedDB database');
    }
}

/**
 * 
 * Stores the private key in IndexedDB.
 * @param {CryptoKey} privateKey - The private key to store.
 * @returns {Promise<void>}
 */
export async function storePrivateKey(privateKey: CryptoKey): Promise<void> {
    const db = await getDatabase();
    try{ 
        await db.put(STORE_NAME, privateKey, PRIVATE_KEY_ID);
    } catch (error) {
        console.error('Failed to store private key:', error);
        throw new Error('Failed to store private key');
    }
}

/**
 * Loads the private key from IndexedDB.
 * @returns {Promise<CryptoKey>} The private key or throws an error if not found.
 * @throws {Error} If the private key is not found in storage.
 */
export async function loadPrivateKey(): Promise<CryptoKey> {
    const db = await getDatabase();
    const privateKey = await db.get(STORE_NAME, PRIVATE_KEY_ID);
    if (!privateKey) {
        throw new Error('Private key not found in storage');
    }
    return privateKey;
}

/**
 * Deletes the private key from IndexedDB.
 * @returns {Promise<void>}
 */
export async function deletePrivateKey(): Promise<void> {
    const db = await getDatabase();
    try {
        await db.delete(STORE_NAME, PRIVATE_KEY_ID);
    } catch (error) {
        console.error('Failed to delete private key:', error);
        throw new Error('Failed to delete private key');
    }
}

/**
 * Stores the signed prekey private key in IndexedDB.
 * @param {StoredSignedPrekey} prekeyPrivate - The signed prekey private key and timestamp to store.
 * @returns {Promise<void>}
 */
export async function storeSignedPrekeyPrivateKey(prekeyPrivate: StoredSignedPrekey): Promise<void> {
    const db = await getDatabase();
    try {
        await db.put(STORE_NAME, prekeyPrivate, SIGNED_PREKEY_PRIVATE_ID);
    } catch (error) {
        console.error('Failed to store signed prekey private key:', error);
        throw new Error('Failed to store signed prekey private key');
    }
}

/**
 * Loads the signed prekey private key from IndexedDB.
 * @returns {Promise<StoredSignedPrekey>} The signed prekey private key or throws an error if not found.
 * @throws {Error} If the signed prekey private key is not found in storage.
 */
export async function loadSignedPrekeyPrivateKey(): Promise<StoredSignedPrekey> {
    const db = await getDatabase();
    const prekeyPrivate = await db.get(STORE_NAME, SIGNED_PREKEY_PRIVATE_ID);
    if (!prekeyPrivate) {
        throw new Error('Signed prekey private key not found in storage');
    }
    return prekeyPrivate as StoredSignedPrekey;
}

/**
 * Deletes the signed prekey private key from IndexedDB.
 * @returns {Promise<void>}
 */
export async function deleteSignedPrekeyPrivateKey(): Promise<void> {
    const db = await getDatabase();
    try {
        await db.delete(STORE_NAME, SIGNED_PREKEY_PRIVATE_ID);
    } catch (error) {
        console.error('Failed to delete signed prekey private key:', error);
        throw new Error('Failed to delete signed prekey private key');
    }
}

/**
 * Stores the ratchet state in IndexedDB for a specific contact.
 * @param ratchetState - The ratchet state to store.
 * @param contactID - The unique identifier for the contact.
 * @return {Promise<void>} 
 */
export async function storeRatchetState(ratchetState: any, contactID: number): Promise<void> {
    const db = await getDatabase();
    const contactIDStr = contactID.toString(); // Ensure contactID is a string
    const ratchetKey = `${RATCHET_STATE_ID}-${contactID}`;
    try {
        await db.put(STORE_NAME, ratchetState, ratchetKey);
    } catch (error) {
        console.error('Failed to store ratchet state:', error);
        throw new Error('Failed to store ratchet state');
    }
}

/**
 * Retrieves the ratchet state for a specific contact.
 * Initializes the ratchet state if it does not exist.
 * @param contactID - The unique identifier for the contact.
 * @param config - The configuration for the double ratchet algorithm in case it needs to be initialized.
 * @returns {Promise<any>} The initial ratchet state for the contact.
 * @throws {Error} If there is an error initializing the ratchet state.
 */
export async function getRatchetState(config: DoubleRatchetConfig, contactID: number): Promise<any> {
    const contactIDStr = contactID.toString(); // Ensure contactID is a string
    let state = await loadRatchetState(contactIDStr);
    if (!state) {
        state = await initializeRatchetState(config, contactID);
        await storeRatchetState(state, contactID);
    }
    return state;
}

/**
 * Loads the ratchet state for a specific contact from IndexedDB.
 * @param contactID - The unique identifier for the contact.
 * @returns {Promise<any>} The ratchet state or null if not found.
 * @throws {Error} If there is an error loading the ratchet state.
 */
export async function loadRatchetState(contactID: string): Promise<any> {
    const db = await getDatabase();
    const ratchetKey = `${RATCHET_STATE_ID}-${contactID}`;
    try {
        const ratchetState = await db.get(STORE_NAME, ratchetKey);
        if (!ratchetState) {
            console.warn('Ratchet state not found in storage');
            return null; // Return null if the ratchet state is not found
        }
        return ratchetState;
    } catch (error) {
        console.error('Failed to load ratchet state:', error);
        throw new Error('Failed to load ratchet state');
    }
}

/**
 * Deletes the ratchet state for a specific contact from IndexedDB.
 * @param contactID - The unique identifier for the contact.
 * @returns {Promise<void>}
 */
export async function deleteRatchetState(contactID: string): Promise<void> {
    const db = await getDatabase();
    const ratchetKey = `${RATCHET_STATE_ID}-${contactID}`;
    try {
        await db.delete(STORE_NAME, ratchetKey);
    } catch (error) {
        console.error('Failed to delete ratchet state:', error);
        throw new Error('Failed to delete ratchet state');
    }
}

/**
 * Clears all keys and states from the IndexedDB store.
 * @returns {Promise<void>}
 */
export async function clearAll(): Promise<void> {
    const db = await getDatabase();
    try {
        await db.clear(STORE_NAME);
    } catch (error) {
        console.error('Failed to clear IndexedDB store:', error);
        throw new Error('Failed to clear IndexedDB store');
    }
}

/**
 * Checks if the IndexedDB store is empty.
 * @returns {Promise<boolean>} True if the store is empty, false otherwise.
 */
export async function isStoreEmpty(): Promise<boolean> {
    const db = await getDatabase();
    const count = await db.count(STORE_NAME);
    return count === 0;
}