import { EncryptionService } from './encryption-service.js';

// Create separate encryption service instances for Alice and Bob with different databases
export const aliceEncryptionService = new EncryptionService(undefined, 'AliceEncryptionDB');
export const bobEncryptionService = new EncryptionService(undefined, 'BobEncryptionDB');

// Set up their message bus subscriptions
aliceEncryptionService.setupMessageBus('alice');
bobEncryptionService.setupMessageBus('bob');

// Function to get the encryption service for a specific user
export function getEncryptionServiceForUser(userId: string): EncryptionService {
	switch (userId) {
		case 'alice':
			return aliceEncryptionService;
		case 'bob':
			return bobEncryptionService;
		default:
			throw new Error(`Unknown user ID: ${userId}`);
	}
}

// Function to establish bidirectional test sessions between Alice and Bob
export async function establishDemoSessions(): Promise<void> {
	console.log('Setting up demo sessions between Alice and Bob...');

	try {
		// Create simple demo sessions that share the same static key material
		console.log('Creating Alice → Bob session...');
		await aliceEncryptionService.createTestSession('bob', 2);

		console.log('Creating Bob → Alice session...');
		await bobEncryptionService.createTestSession('alice', 1);

		// Create simple receiving sessions with shared static keys
		console.log('Creating receiving sessions with shared keys...');
		await createSharedReceivingSession();

		console.log('✅ All demo sessions established successfully');
	} catch (error) {
		console.error('❌ Failed to establish demo sessions:', error);
		throw error;
	}
}

// Helper function to create shared sessions for both sending and receiving
async function createSharedReceivingSession(): Promise<void> {
	// Use a single, static chain key for the entire demo
	const sharedChainKey = new Uint8Array(32).fill(99); // Static chain key

	// Create a special demo session that uses the static key directly
	const createStaticSession = () => ({
		rootKey: new Uint8Array(32).fill(1),
		chainKey: new Uint8Array(sharedChainKey), // Copy the array to avoid shared references
		sendingChainLength: 0,
		receivingChainLength: 0,
		previousSendingChainLength: 0,
		sendingEphemeralKey: {
			publicKey: new Uint8Array(32).fill(3),
			privateKey: new Uint8Array(32).fill(4)
		},
		receivingEphemeralKey: undefined,
		messageKeys: new Map(),
		skippedKeys: new Map(),
		// Add a demo flag to prevent key evolution
		isDemoSession: true
	});

	// OVERRIDE both sending and receiving sessions with static keys
	// This ensures both encryption and decryption use the same key material

	// Key insight: Alice encrypts with "bob-2" but Bob decrypts with "alice-1"
	// We need identical sessions for both encryption and decryption

	// Alice sends to Bob using "bob-2" -> Bob receives from Alice using "alice-1"
	const aliceToBobSession = createStaticSession();
	aliceEncryptionService.addProtocolSession('bob-2', aliceToBobSession); // Alice encrypts
	bobEncryptionService.addProtocolSession('alice-1', aliceToBobSession); // Bob decrypts

	// Bob sends to Alice using "alice-1" -> Alice receives from Bob using "bob-2"
	const bobToAliceSession = createStaticSession();
	bobEncryptionService.addProtocolSession('alice-1', bobToAliceSession); // Bob encrypts
	aliceEncryptionService.addProtocolSession('bob-2', bobToAliceSession); // Alice decrypts

	console.log('✓ All shared static sessions created (both sending and receiving)');
}
