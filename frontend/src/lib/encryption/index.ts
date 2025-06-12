// Core encryption exports
export { CryptoUtils } from './crypto-utils.js';
export { SecureKeyStorage } from './key-storage.js';
export { DoubleRatchetProtocol } from './double-ratchet.js';
export { EncryptionService, encryptionService } from './encryption-service.js';
export { messageBus } from './message-bus.js';
export {
	aliceEncryptionService,
	bobEncryptionService,
	getEncryptionServiceForUser,
	establishDemoSessions
} from './demo-services.js';

// Experiment configuration exports
export { 
	ExperimentConfigurations, 
	ExperimentConfigBuilder 
} from './experiment-configs.js';

// Type exports
export type {
	KeyPair,
	IdentityKeyPair,
	PreKeyBundle,
	EncryptedMessage,
	DecryptedMessage,
	SessionState,
	DoubleRatchetSession,
	StoredKey,
	EncryptionConfig,
	EncryptionMetrics
} from './types.js';

// Experiment type exports
export type { ExperimentConfig } from './experiment-configs.js';

// Enum exports
export { MessageType } from './types.js';
