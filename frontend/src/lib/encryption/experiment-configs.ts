import type { EncryptionConfig } from './types.js';

/**
 * Extended configuration interface for academic experiments
 */
export interface ExperimentConfig extends EncryptionConfig {
	// Research-specific parameters
	keyEvolutionFrequency: number; // How often keys evolve (1 = every message)
	preKeyGenerationCount: number; // Number of pre-keys to generate
	sessionMemoryLimit: number; // Max sessions to keep in memory
	enableMetricsLogging: boolean; // Detailed performance logging
	simulateNetworkDelay: boolean; // Add artificial delays
	forceKeyRotation: boolean; // Force frequent key rotation for testing
	cryptographicBackend: 'noble' | 'webcrypto'; // Crypto library to use

	// Protocol behavior tweaks
	allowOutOfOrderMessages: boolean; // Handle message reordering
	strictForwardSecrecy: boolean; // Delete keys immediately after use
	enablePostCompromiseSecurity: boolean; // Recover from key compromise

	// Performance tuning
	asyncKeyDerivation: boolean; // Derive keys asynchronously
	keyDerivationBatchSize: number; // Batch key operations
	messageBufferSize: number; // Buffer for batching messages
}

/**
 * Predefined experimental configurations for academic research
 */
export class ExperimentConfigurations {
	/**
	 * Baseline configuration - standard Signal protocol parameters
	 */
	static readonly BASELINE: ExperimentConfig = {
		// Standard Double Ratchet parameters
		maxSkippedMessageKeys: 1000,
		maxMessageKeyAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		preKeyRotationInterval: 24 * 60 * 60 * 1000, // 1 day
		signedPreKeyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days

		// Research parameters
		keyEvolutionFrequency: 1, // Evolve on every message
		preKeyGenerationCount: 100, // Standard pre-key count
		sessionMemoryLimit: 1000, // Keep 1000 sessions max
		enableMetricsLogging: true,
		simulateNetworkDelay: false,
		forceKeyRotation: false,
		cryptographicBackend: 'noble',

		// Protocol behavior
		allowOutOfOrderMessages: true,
		strictForwardSecrecy: false,
		enablePostCompromiseSecurity: true,

		// Performance
		asyncKeyDerivation: false,
		keyDerivationBatchSize: 1,
		messageBufferSize: 10
	};

	/**
	 * High security configuration - maximum security, performance secondary
	 */
	static readonly HIGH_SECURITY: ExperimentConfig = {
		...this.BASELINE,
		maxSkippedMessageKeys: 50, // Limit memory usage
		maxMessageKeyAge: 1 * 24 * 60 * 60 * 1000, // 1 day key expiry
		preKeyRotationInterval: 4 * 60 * 60 * 1000, // 4 hours
		signedPreKeyRotationInterval: 1 * 24 * 60 * 60 * 1000, // 1 day

		keyEvolutionFrequency: 1, // Every message
		preKeyGenerationCount: 200, // More pre-keys for perfect forward secrecy
		sessionMemoryLimit: 100, // Limit session storage
		forceKeyRotation: true, // Aggressive key rotation

		strictForwardSecrecy: true, // Delete keys immediately
		enablePostCompromiseSecurity: true,
		allowOutOfOrderMessages: false // Strict ordering for security
	};

	/**
	 * Performance optimized - faster operations, relaxed security
	 */
	static readonly PERFORMANCE_OPTIMIZED: ExperimentConfig = {
		...this.BASELINE,
		maxSkippedMessageKeys: 5000, // Large buffer for out-of-order
		maxMessageKeyAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		preKeyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
		signedPreKeyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days

		keyEvolutionFrequency: 10, // Evolve every 10 messages
		preKeyGenerationCount: 50, // Fewer pre-keys
		sessionMemoryLimit: 10000, // Large session cache
		forceKeyRotation: false,

		strictForwardSecrecy: false,
		asyncKeyDerivation: true, // Async operations
		keyDerivationBatchSize: 10, // Batch operations
		messageBufferSize: 100 // Large message buffer
	};

	/**
	 * Low memory configuration - for IoT/constrained devices
	 */
	static readonly LOW_MEMORY: ExperimentConfig = {
		...this.BASELINE,
		maxSkippedMessageKeys: 10, // Very limited memory
		maxMessageKeyAge: 3 * 24 * 60 * 60 * 1000, // 3 days
		preKeyRotationInterval: 2 * 24 * 60 * 60 * 1000, // 2 days
		signedPreKeyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days

		keyEvolutionFrequency: 1,
		preKeyGenerationCount: 10, // Minimal pre-keys
		sessionMemoryLimit: 10, // Very few sessions
		enableMetricsLogging: false, // Reduce overhead

		strictForwardSecrecy: true, // Save memory by deleting keys
		allowOutOfOrderMessages: false, // Simplify logic
		asyncKeyDerivation: false, // Synchronous for predictability
		keyDerivationBatchSize: 1,
		messageBufferSize: 1
	};

	/**
	 * Research configuration - for studying protocol behavior
	 */
	static readonly RESEARCH: ExperimentConfig = {
		...this.BASELINE,
		maxSkippedMessageKeys: 500,
		maxMessageKeyAge: 14 * 24 * 60 * 60 * 1000, // 14 days
		preKeyRotationInterval: 3 * 24 * 60 * 60 * 1000, // 3 days
		signedPreKeyRotationInterval: 14 * 24 * 60 * 60 * 1000, // 14 days

		keyEvolutionFrequency: 5, // Evolve every 5 messages
		preKeyGenerationCount: 75,
		sessionMemoryLimit: 500,
		enableMetricsLogging: true,
		simulateNetworkDelay: true, // Study network effects

		allowOutOfOrderMessages: true,
		strictForwardSecrecy: false,
		enablePostCompromiseSecurity: true,
		asyncKeyDerivation: true,
		keyDerivationBatchSize: 5,
		messageBufferSize: 25
	};

	/**
	 * Network disruption test - for studying message loss/reordering
	 */
	static readonly NETWORK_DISRUPTION: ExperimentConfig = {
		...this.BASELINE,
		maxSkippedMessageKeys: 2000, // Handle many out-of-order messages
		maxMessageKeyAge: 7 * 24 * 60 * 60 * 1000,

		keyEvolutionFrequency: 1,
		preKeyGenerationCount: 150,
		enableMetricsLogging: true,
		simulateNetworkDelay: true,

		allowOutOfOrderMessages: true, // Essential for network disruption
		strictForwardSecrecy: false, // Keep keys longer for reordering
		messageBufferSize: 50 // Large buffer for reordering
	};

	/**
	 * Key compromise recovery test - for studying post-compromise security
	 */
	static readonly COMPROMISE_RECOVERY: ExperimentConfig = {
		...this.BASELINE,
		preKeyRotationInterval: 1 * 60 * 60 * 1000, // 1 hour - very frequent
		signedPreKeyRotationInterval: 4 * 60 * 60 * 1000, // 4 hours

		keyEvolutionFrequency: 1, // Immediate key evolution
		preKeyGenerationCount: 300, // Many pre-keys for recovery
		forceKeyRotation: true,
		enablePostCompromiseSecurity: true,
		strictForwardSecrecy: true
	};

	/**
	 * Get all available configuration names
	 */
	static getConfigurationNames(): string[] {
		return [
			'BASELINE',
			'HIGH_SECURITY',
			'PERFORMANCE_OPTIMIZED',
			'LOW_MEMORY',
			'RESEARCH',
			'NETWORK_DISRUPTION',
			'COMPROMISE_RECOVERY'
		];
	}

	/**
	 * Get configuration by name
	 */
	static getConfiguration(name: string): ExperimentConfig {
		switch (name.toUpperCase()) {
			case 'BASELINE':
				return this.BASELINE;
			case 'HIGH_SECURITY':
				return this.HIGH_SECURITY;
			case 'PERFORMANCE_OPTIMIZED':
				return this.PERFORMANCE_OPTIMIZED;
			case 'LOW_MEMORY':
				return this.LOW_MEMORY;
			case 'RESEARCH':
				return this.RESEARCH;
			case 'NETWORK_DISRUPTION':
				return this.NETWORK_DISRUPTION;
			case 'COMPROMISE_RECOVERY':
				return this.COMPROMISE_RECOVERY;
			default:
				throw new Error(`Unknown configuration: ${name}`);
		}
	}

	/**
	 * Create a custom configuration from base config
	 */
	static createCustomConfig(
		baseConfig: string,
		overrides: Partial<ExperimentConfig>
	): ExperimentConfig {
		const base = this.getConfiguration(baseConfig);
		return { ...base, ...overrides };
	}

	/**
	 * Compare two configurations
	 */
	static compareConfigurations(
		config1: ExperimentConfig,
		config2: ExperimentConfig
	): {
		property: string;
		value1: any;
		value2: any;
		different: boolean;
	}[] {
		const keys = Object.keys(config1) as (keyof ExperimentConfig)[];
		return keys.map((key) => ({
			property: key,
			value1: config1[key],
			value2: config2[key],
			different: config1[key] !== config2[key]
		}));
	}

	/**
	 * Get configuration summary for academic reporting
	 */
	static getConfigurationSummary(config: ExperimentConfig): {
		security: 'Low' | 'Medium' | 'High';
		performance: 'Low' | 'Medium' | 'High';
		memoryUsage: 'Low' | 'Medium' | 'High';
		suitableFor: string[];
	} {
		// Calculate security level
		const securityScore =
			(config.strictForwardSecrecy ? 1 : 0) +
			(config.maxSkippedMessageKeys < 100 ? 1 : 0) +
			(config.keyEvolutionFrequency === 1 ? 1 : 0) +
			(config.preKeyRotationInterval < 24 * 60 * 60 * 1000 ? 1 : 0);

		// Calculate performance level
		const performanceScore =
			(config.asyncKeyDerivation ? 1 : 0) +
			(config.keyDerivationBatchSize > 1 ? 1 : 0) +
			(config.messageBufferSize > 10 ? 1 : 0) +
			(config.keyEvolutionFrequency > 1 ? 1 : 0);

		// Calculate memory usage
		const memoryScore =
			(config.maxSkippedMessageKeys > 1000 ? 1 : 0) +
			(config.sessionMemoryLimit > 500 ? 1 : 0) +
			(config.preKeyGenerationCount > 100 ? 1 : 0) +
			(!config.strictForwardSecrecy ? 1 : 0);

		const getLevel = (score: number) => (score >= 3 ? 'High' : score >= 2 ? 'Medium' : 'Low');

		const suitableFor: string[] = [];
		if (securityScore >= 3) suitableFor.push('High-security applications');
		if (performanceScore >= 3) suitableFor.push('High-throughput messaging');
		if (memoryScore <= 1) suitableFor.push('IoT/embedded devices');
		if (config.allowOutOfOrderMessages) suitableFor.push('Unreliable networks');
		if (config.enablePostCompromiseSecurity) suitableFor.push('Long-term communications');

		return {
			security: getLevel(securityScore),
			performance: getLevel(performanceScore),
			memoryUsage: getLevel(memoryScore),
			suitableFor
		};
	}
}

/**
 * Configuration builder for creating custom experiments
 */
export class ExperimentConfigBuilder {
	private config: ExperimentConfig;

	constructor(baseConfig: string = 'BASELINE') {
		this.config = { ...ExperimentConfigurations.getConfiguration(baseConfig) };
	}

	setSecurityLevel(level: 'low' | 'medium' | 'high'): this {
		switch (level) {
			case 'high':
				this.config.maxSkippedMessageKeys = 50;
				this.config.keyEvolutionFrequency = 1;
				this.config.strictForwardSecrecy = true;
				this.config.forceKeyRotation = true;
				break;
			case 'medium':
				this.config.maxSkippedMessageKeys = 500;
				this.config.keyEvolutionFrequency = 5;
				this.config.strictForwardSecrecy = false;
				this.config.forceKeyRotation = false;
				break;
			case 'low':
				this.config.maxSkippedMessageKeys = 2000;
				this.config.keyEvolutionFrequency = 10;
				this.config.strictForwardSecrecy = false;
				this.config.forceKeyRotation = false;
				break;
		}
		return this;
	}

	setPerformanceLevel(level: 'low' | 'medium' | 'high'): this {
		switch (level) {
			case 'high':
				this.config.asyncKeyDerivation = true;
				this.config.keyDerivationBatchSize = 10;
				this.config.messageBufferSize = 100;
				break;
			case 'medium':
				this.config.asyncKeyDerivation = true;
				this.config.keyDerivationBatchSize = 5;
				this.config.messageBufferSize = 25;
				break;
			case 'low':
				this.config.asyncKeyDerivation = false;
				this.config.keyDerivationBatchSize = 1;
				this.config.messageBufferSize = 1;
				break;
		}
		return this;
	}

	setMemoryConstraints(level: 'low' | 'medium' | 'high'): this {
		switch (level) {
			case 'low':
				this.config.sessionMemoryLimit = 10;
				this.config.preKeyGenerationCount = 10;
				this.config.maxSkippedMessageKeys = 10;
				break;
			case 'medium':
				this.config.sessionMemoryLimit = 500;
				this.config.preKeyGenerationCount = 75;
				this.config.maxSkippedMessageKeys = 500;
				break;
			case 'high':
				this.config.sessionMemoryLimit = 5000;
				this.config.preKeyGenerationCount = 200;
				this.config.maxSkippedMessageKeys = 2000;
				break;
		}
		return this;
	}

	enableNetworkSimulation(enable: boolean = true): this {
		this.config.simulateNetworkDelay = enable;
		if (enable) {
			this.config.allowOutOfOrderMessages = true;
			this.config.messageBufferSize = Math.max(this.config.messageBufferSize, 25);
		}
		return this;
	}

	enableDetailedMetrics(enable: boolean = true): this {
		this.config.enableMetricsLogging = enable;
		return this;
	}

	build(): ExperimentConfig {
		return { ...this.config };
	}
}
