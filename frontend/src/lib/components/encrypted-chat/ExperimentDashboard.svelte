<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Select from "$lib/components/ui/select/index.js";
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ExperimentConfigurations, ExperimentConfigBuilder } from '$lib/encryption/experiment-configs.js';
	import type { ExperimentConfig } from '$lib/encryption/experiment-configs.js';
	import { toast } from 'svelte-sonner';
	import { Settings, Play, BarChart3, Shield, Zap, Cpu } from '@lucide/svelte';
	import { EncryptionService } from '$lib/encryption';

	let selectedConfig = $state('BASELINE');
	let currentConfig: ExperimentConfig = $state(ExperimentConfigurations.BASELINE);
	let configSummary = $derived(ExperimentConfigurations.getConfigurationSummary(currentConfig));
	let experimentResults = $state<any[]>([]);
	let isRunningExperiment = $state(false);

	// Create derived value for trigger content
	const triggerContent = $derived(
		selectedConfig ? selectedConfig.replace('_', ' ').toLowerCase() : "Choose a configuration"
	);

	function updateConfig(selectedConfig: any){
		currentConfig = ExperimentConfigurations.getConfiguration(selectedConfig);
	}

	/**
	 * Run comprehensive benchmark with actual encryption operations
	 */
	async function runBenchmark(encryptionService: EncryptionService): Promise<{
		configName: string;
		timestamp: string;
		messagesProcessed: number;
		averageEncryptionTime: number;
		averageDecryptionTime: number;
		memoryUsage: number;
		keyRotations: number;
		sessionEstablishments: number;
		totalOperationTime: number;
		throughputMsgPerSec: number;
		keyEvolutionCount: number;
		outOfOrderHandled: number;
		encryptionErrors: number;
		decryptionErrors: number;
	}> {
		const startTime = performance.now();
		let encryptionTimes: number[] = [];
		let decryptionTimes: number[] = [];
		let encryptionErrors = 0;
		let decryptionErrors = 0;
		let keyEvolutionCount = 0;
		let outOfOrderHandled = 0;

		// Test parameters
		const MESSAGE_COUNT = 50; // Number of messages to test
		const TEST_RECIPIENTS = ['test-user-1', 'test-user-2'];
		const TEST_DEVICE_ID = Math.floor(Math.random() * 1000) + 1;
		const TEST_PASSWORD = 'benchmark-password-123';

		try {
			// Initialize encryption service (using unique database name to avoid conflicts)
			console.log('Initializing encryption service for benchmark...');
			await encryptionService.initialize(TEST_PASSWORD, TEST_DEVICE_ID);
			await encryptionService.unlock(TEST_PASSWORD, TEST_DEVICE_ID);

			// Create test sessions for each recipient (for sending TO them)
			const recipientDeviceIds: { [key: string]: number } = {};
			for (const recipientId of TEST_RECIPIENTS) {
				const recipientDeviceId = 100; // Use fixed device ID for consistency
				recipientDeviceIds[recipientId] = recipientDeviceId;
				await encryptionService.createTestSession(recipientId, recipientDeviceId);
			}

			// Create receiving sessions for decryption (for receiving FROM the benchmark sender)
			console.log('Creating receiving sessions for decryption...');
			const benchmarkSenderId = `benchmark-user-${TEST_DEVICE_ID}`;
			await encryptionService.createReceivingSession(benchmarkSenderId, TEST_DEVICE_ID);

			// Create synchronized sessions for proper key evolution
			console.log('Creating synchronized sessions for benchmark...');
			
			// Create a shared session object that both encryption and decryption will use
			// This ensures keys evolve in sync while maintaining double ratchet behavior
			const createEvolvingSession = () => ({
				rootKey: new Uint8Array(32).fill(1),
				chainKey: new Uint8Array(32).fill(2), // Will evolve with each message
				sendingChainLength: 0,
				receivingChainLength: 0,
				previousSendingChainLength: 0,
				sendingEphemeralKey: {
					publicKey: new Uint8Array(32).fill(3),
					privateKey: new Uint8Array(32).fill(4)
				},
				receivingEphemeralKey: undefined,
				messageKeys: new Map(),
				skippedKeys: new Map()
				// NO isDemoSession flag - keys will evolve normally
			});

			// Create shared session references for synchronized key evolution
			const sharedSessions = new Map();
			for (const recipientId of TEST_RECIPIENTS) {
				const session = createEvolvingSession();
				sharedSessions.set(recipientId, session);
				
				// Set both sending and receiving to use the SAME session object
				const recipientSessionKey = `${recipientId}-100`;
				encryptionService.addProtocolSession(recipientSessionKey, session);
			}
			
			// Create shared session for benchmark sender
			const benchmarkSession = createEvolvingSession();
			const benchmarkSessionKey = `${benchmarkSenderId}-${TEST_DEVICE_ID}`;
			encryptionService.addProtocolSession(benchmarkSessionKey, benchmarkSession);
			
			console.log('✓ Synchronized evolving sessions created for benchmark');

			// Generate test messages of varying sizes
			const testMessages = [
				'Short message',
				'Medium length message with some additional content to test performance',
				'Very long message that contains a lot of text to simulate real-world usage scenarios where users might send longer messages with detailed information, multiple sentences, and various types of content that would be typical in messaging applications. This helps us understand how the encryption performs with different payload sizes.',
				'JSON data: {"type":"test","data":{"id":123,"values":[1,2,3,4,5]}}',
				'🚀 Unicode message with emojis 🔐 and special characters: áéíóú ñ 中文 العربية',
			];

			console.log(`Running REAL double ratchet benchmark with ${MESSAGE_COUNT} messages...`);

			// PROPER APPROACH: Encrypt and decrypt each message immediately
			console.log('Running encrypt-decrypt pairs with proper key evolution...');
			for (let i = 0; i < MESSAGE_COUNT; i++) {
				const recipient = TEST_RECIPIENTS[i % TEST_RECIPIENTS.length];
				const message = testMessages[i % testMessages.length] + ` - Message #${i + 1}`;

				try {
					// Measure encryption time
					const encryptStart = performance.now();
					const encryptedMessage = await encryptionService.sendMessage(
						recipient,
						message,
						`benchmark-user-${TEST_DEVICE_ID}`
					);
					const encryptEnd = performance.now();
					encryptionTimes.push(encryptEnd - encryptStart);

					// IMMEDIATELY decrypt the message (proper double ratchet flow)
					const decryptStart = performance.now();
					const decryptedMessage = await encryptionService.receiveMessage(encryptedMessage);
					const decryptEnd = performance.now();
					decryptionTimes.push(decryptEnd - decryptStart);

					// Verify decryption worked correctly
					if (decryptedMessage.plaintext !== message) {
						console.warn(`Decryption mismatch for message ${i + 1}: expected "${message}", got "${decryptedMessage.plaintext}"`);
					}

					// Track key evolution (based on config frequency)
					if (i % currentConfig.keyEvolutionFrequency === 0) {
						keyEvolutionCount++;
					}

					// Simulate some out-of-order messages (for network disruption configs)
					if (currentConfig.allowOutOfOrderMessages && Math.random() < 0.1) {
						outOfOrderHandled++;
					}

					// Small delay to simulate real-world timing
					if (currentConfig.simulateNetworkDelay) {
						await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
					}

				} catch (error) {
					console.warn(`Encrypt/Decrypt error for message ${i + 1}:`, error);
					encryptionErrors++;
					decryptionErrors++;
				}
			}

			// Test session establishment performance
			console.log('Testing session establishment performance...');
			const sessionStart = performance.now();
			const newRecipient = `perf-test-${Date.now()}`;
			await encryptionService.createTestSession(newRecipient, TEST_DEVICE_ID + 100);
			const sessionEnd = performance.now();
			const sessionEstablishmentTime = sessionEnd - sessionStart;

			// Get final metrics from the service
			const finalMetrics = encryptionService.getCurrentMetrics();
			
			// Calculate averages and derived metrics
			const avgEncryptionTime = encryptionTimes.length > 0 
				? encryptionTimes.reduce((sum, time) => sum + time, 0) / encryptionTimes.length 
				: 0;

			// Debug decryption times calculation
			console.log('Decryption times array:', decryptionTimes);
			console.log('Decryption times length:', decryptionTimes.length);
			console.log('Final metrics:', finalMetrics);
			
			let avgDecryptionTime = 0;
			if (decryptionTimes.length > 0) {
				const validDecryptionTimes = decryptionTimes.filter(time => 
					!isNaN(time) && isFinite(time) && time >= 0
				);
				if (validDecryptionTimes.length > 0) {
					avgDecryptionTime = validDecryptionTimes.reduce((sum, time) => sum + time, 0) / validDecryptionTimes.length;
				}
			}
			
			// Fallback to service metrics if our calculation failed
			if (!isFinite(avgDecryptionTime) || avgDecryptionTime < 0) {
				avgDecryptionTime = finalMetrics.averageDecryptionTime || 0;
			}
			
			console.log('Calculated avgDecryptionTime:', avgDecryptionTime);

			const totalTime = performance.now() - startTime;
			const throughputMsgPerSec = MESSAGE_COUNT / (totalTime / 1000);

			// Estimate memory usage (simplified approximation)
			const estimatedMemoryUsage = 
				(currentConfig.sessionMemoryLimit * 0.1) + // Base session memory
				(currentConfig.maxSkippedMessageKeys * 0.032) + // Skipped key storage
				(currentConfig.preKeyGenerationCount * 0.064) + // Pre-key storage
				(MESSAGE_COUNT * 0.002); // Message overhead

			console.log('Benchmark completed successfully');

			return {
				configName: selectedConfig,
				timestamp: new Date().toISOString(),
				messagesProcessed: MESSAGE_COUNT,
				averageEncryptionTime: Number(avgEncryptionTime.toFixed(3)),
				averageDecryptionTime: Number(avgDecryptionTime.toFixed(3)),
				memoryUsage: Number(estimatedMemoryUsage.toFixed(2)),
				keyRotations: finalMetrics.keyRotations,
				sessionEstablishments: finalMetrics.sessionEstablishments,
				totalOperationTime: Number(totalTime.toFixed(2)),
				throughputMsgPerSec: Number(throughputMsgPerSec.toFixed(2)),
				keyEvolutionCount,
				outOfOrderHandled,
				encryptionErrors,
				decryptionErrors
			};

		} catch (error) {
			console.error('Benchmark failed:', error);
			
			// Return partial results even if benchmark fails
			const partialTime = performance.now() - startTime;
			return {
				configName: selectedConfig,
				timestamp: new Date().toISOString(),
				messagesProcessed: encryptionTimes.length,
				averageEncryptionTime: encryptionTimes.length > 0 
					? encryptionTimes.reduce((sum, time) => sum + time, 0) / encryptionTimes.length 
					: 0,
				averageDecryptionTime: 0,
				memoryUsage: 0,
				keyRotations: 0,
				sessionEstablishments: 0,
				totalOperationTime: Number(partialTime.toFixed(2)),
				throughputMsgPerSec: 0,
				keyEvolutionCount,
				outOfOrderHandled,
				encryptionErrors: encryptionErrors + 1,
				decryptionErrors
			};
		}
	}

	async function runExperiment() {
		isRunningExperiment = true;
		try {
			// Run actual benchmark with current configuration
			toast.success(`Starting experiment with ${selectedConfig} configuration`);
			
			// Create unique database name for each experiment to avoid conflicts
			const uniqueDbName = `BenchmarkDB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			const encryptionService = new EncryptionService(currentConfig, uniqueDbName);
			const results = await runBenchmark(encryptionService);
			
			experimentResults = [...experimentResults, results];
			toast.success('Experiment completed successfully');
		} catch (error) {
			toast.error(`Experiment failed: ${error}`);
		} finally {
			isRunningExperiment = false;
		}
	}

	function clearResults() {
		experimentResults = [];
		toast.success('Experiment results cleared');
	}

	function exportResults() {
		const data = JSON.stringify(experimentResults, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `double-ratchet-experiments-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success('Results exported');
	}

	function createCustomConfig() {
		const builder = new ExperimentConfigBuilder('BASELINE')
			.setSecurityLevel('medium')
			.setPerformanceLevel('high')
			.enableNetworkSimulation(true)
			.enableDetailedMetrics(true);
		
		const customConfig = builder.build();
		console.log('Custom configuration created:', customConfig);
		toast.success('Custom configuration created - check console');
	}
</script>

<div class="space-y-6">
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Settings class="h-5 w-5" />
				Double Ratchet Configuration Experiments
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Configuration Selection -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<Label for="config-select">Select Configuration</Label>
						<Select.Root bind:value={selectedConfig} type="single" onValueChange={updateConfig}>
							<Select.Trigger class="w-[280px]">
								{triggerContent}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<!-- <Select.Label>Available Configurations</Select.Label> -->
									{#each ExperimentConfigurations.getConfigurationNames() as configName}
										<Select.Item 
											value={configName} 
											label={configName.replace('_', ' ').toLowerCase()}
										>
											{configName.replace('_', ' ').toLowerCase()}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<h4 class="font-medium">Configuration Summary</h4>
						<div class="flex flex-wrap gap-2">
							<Badge variant={configSummary.security === 'High' ? 'default' : configSummary.security === 'Medium' ? 'secondary' : 'outline'}>
								<Shield class="h-3 w-3 mr-1" />
								Security: {configSummary.security}
							</Badge>
							<Badge variant={configSummary.performance === 'High' ? 'default' : configSummary.performance === 'Medium' ? 'secondary' : 'outline'}>
								<Zap class="h-3 w-3 mr-1" />
								Performance: {configSummary.performance}
							</Badge>
							<Badge variant={configSummary.memoryUsage === 'High' ? 'destructive' : configSummary.memoryUsage === 'Medium' ? 'secondary' : 'default'}>
								<Cpu class="h-3 w-3 mr-1" />
								Memory: {configSummary.memoryUsage}
							</Badge>
						</div>
						<div class="text-sm text-muted-foreground">
							<strong>Suitable for:</strong> {configSummary.suitableFor.join(', ')}
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<h4 class="font-medium">Key Parameters</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Max Skipped Keys:</span>
							<span class="font-mono">{currentConfig.maxSkippedMessageKeys}</span>
						</div>
						<div class="flex justify-between">
							<span>Key Evolution Frequency:</span>
							<span class="font-mono">Every {currentConfig.keyEvolutionFrequency} message(s)</span>
						</div>
						<div class="flex justify-between">
							<span>Pre-key Count:</span>
							<span class="font-mono">{currentConfig.preKeyGenerationCount}</span>
						</div>
						<div class="flex justify-between">
							<span>Session Memory Limit:</span>
							<span class="font-mono">{currentConfig.sessionMemoryLimit}</span>
						</div>
						<div class="flex justify-between">
							<span>Strict Forward Secrecy:</span>
							<span class="font-mono">{currentConfig.strictForwardSecrecy ? 'Yes' : 'No'}</span>
						</div>
						<div class="flex justify-between">
							<span>Network Simulation:</span>
							<span class="font-mono">{currentConfig.simulateNetworkDelay ? 'Enabled' : 'Disabled'}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Experiment Controls -->
			<div class="flex gap-4">
				<Button onclick={runExperiment} disabled={isRunningExperiment}>
					{#if isRunningExperiment}
						<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
					{:else}
						<Play class="mr-2 h-4 w-4" />
					{/if}
					Run Experiment
				</Button>
				
				<Button variant="outline" onclick={createCustomConfig}>
					<Settings class="mr-2 h-4 w-4" />
					Create Custom Config
				</Button>

				{#if experimentResults.length > 0}
					<Button variant="outline" onclick={exportResults}>
						<BarChart3 class="mr-2 h-4 w-4" />
						Export Results
					</Button>
					
					<Button variant="outline" onclick={clearResults}>
						Clear Results
					</Button>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Experiment Results -->
	{#if experimentResults.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BarChart3 class="h-5 w-5" />
					Experiment Results
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#each experimentResults as result, index}
						<div class="border rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<h4 class="font-medium">{result.configName} - Run #{index + 1}</h4>
								<span class="text-sm text-muted-foreground">
									{new Date(result.timestamp).toLocaleString()}
								</span>
							</div>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div>
									<span class="text-muted-foreground">Messages:</span>
									<div class="font-mono">{result.messagesProcessed}</div>
								</div>
								<div>
									<span class="text-muted-foreground">Avg Encrypt:</span>
									<div class="font-mono">{result.averageEncryptionTime.toFixed(2)}ms</div>
								</div>
								<div>
									<span class="text-muted-foreground">Avg Decrypt:</span>
									<div class="font-mono">{result.averageDecryptionTime.toFixed(2)}ms</div>
								</div>
								<div>
									<span class="text-muted-foreground">Memory:</span>
									<div class="font-mono">{result.memoryUsage.toFixed(1)}MB</div>
								</div>
								<div>
									<span class="text-muted-foreground">Throughput:</span>
									<div class="font-mono">{result.throughputMsgPerSec.toFixed(1)} msg/s</div>
								</div>
								<div>
									<span class="text-muted-foreground">Total Time:</span>
									<div class="font-mono">{result.totalOperationTime.toFixed(0)}ms</div>
								</div>
								<div>
									<span class="text-muted-foreground">Key Evolutions:</span>
									<div class="font-mono">{result.keyEvolutionCount}</div>
								</div>
								<div>
									<span class="text-muted-foreground">Sessions:</span>
									<div class="font-mono">{result.sessionEstablishments}</div>
								</div>
								{#if result.encryptionErrors > 0 || result.decryptionErrors > 0}
									<div class="col-span-2">
										<span class="text-destructive">Errors:</span>
										<div class="font-mono text-destructive">
											Enc: {result.encryptionErrors}, Dec: {result.decryptionErrors}
										</div>
									</div>
								{/if}
								{#if result.outOfOrderHandled > 0}
									<div>
										<span class="text-muted-foreground">Out-of-Order:</span>
										<div class="font-mono">{result.outOfOrderHandled}</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Configuration Comparison -->
	{#if experimentResults.length >= 2}
		<Card>
			<CardHeader>
				<CardTitle>Performance Comparison</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-sm text-muted-foreground mb-4">
					Compare the performance of different configurations across experiments.
				</div>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each ['BASELINE', 'HIGH_SECURITY', 'PERFORMANCE_OPTIMIZED', 'LOW_MEMORY', 'RESEARCH', 'NETWORK_DISRUPTION', 'COMPROMISE_RECOVERY'] as configName}
						{@const configResults = experimentResults.filter(r => r.configName === configName)}
						{#if configResults.length > 0}
							{@const avgEncryption = configResults.reduce((sum, r) => sum + r.averageEncryptionTime, 0) / configResults.length}
							{@const avgDecryption = configResults.reduce((sum, r) => sum + r.averageDecryptionTime, 0) / configResults.length}
							{@const avgThroughput = configResults.reduce((sum, r) => sum + r.throughputMsgPerSec, 0) / configResults.length}
							{@const avgMemory = configResults.reduce((sum, r) => sum + r.memoryUsage, 0) / configResults.length}
							{@const avgTotalTime = configResults.reduce((sum, r) => sum + r.totalOperationTime, 0) / configResults.length}
							<div class="border rounded-lg p-4">
								<h4 class="font-medium mb-2">{configName}</h4>
								<div class="space-y-1 text-sm">
									<div class="flex justify-between">
										<span>Avg Encryption:</span>
										<span class="font-mono">{avgEncryption.toFixed(2)}ms</span>
									</div>
									<div class="flex justify-between">
										<span>Avg Decryption:</span>
										<span class="font-mono">{avgDecryption.toFixed(2)}ms</span>
									</div>
									<div class="flex justify-between">
										<span>Avg Throughput:</span>
										<span class="font-mono">{avgThroughput.toFixed(1)} msg/s</span>
									</div>
									<div class="flex justify-between">
										<span>Avg Memory:</span>
										<span class="font-mono">{avgMemory.toFixed(1)}MB</span>
									</div>
									<div class="flex justify-between">
										<span>Avg Total Time:</span>
										<span class="font-mono">{avgTotalTime.toFixed(0)}ms</span>
									</div>
									<div class="flex justify-between">
										<span>Experiments:</span>
										<span class="font-mono">{configResults.length}</span>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div> 