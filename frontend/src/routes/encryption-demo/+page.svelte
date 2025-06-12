<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import EncryptionSetup from '$lib/components/encrypted-chat/EncryptionSetup.svelte';
	import EncryptedChat from '$lib/components/encrypted-chat/EncryptedChat.svelte';
	import { aliceEncryptionService, bobEncryptionService, establishDemoSessions } from '$lib/encryption/demo-services.js';
	import type { EncryptionState } from '$lib/encryption/encryption-service.js';
	import { Shield, Key, Zap, Lock, CheckCircle, AlertTriangle, Info, ArrowLeft } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import EncryptionTester from '$lib/components/encrypted-chat/EncryptionTester.svelte';
	import { toast } from 'svelte-sonner';

    let aliceState: EncryptionState | null = $state(null);
    let bobState: EncryptionState | null = $state(null);
    let isSetupComplete = $state(false);
    let isInitializingDemo = $state(false);
    
    // Subscribe to both Alice and Bob's states
    aliceEncryptionService.state.subscribe((state) => {
        aliceState = state;
    });
    
    bobEncryptionService.state.subscribe((state) => {
        bobState = state;
    });

    $effect(() => {
        // Demo is ready when both users are unlocked
        if (aliceState?.isUnlocked && bobState?.isUnlocked && 
            aliceState.deviceId !== null && bobState.deviceId !== null) {
            isSetupComplete = true;
        }
    });

    async function initializeDemo() {
        isInitializingDemo = true;
        try {
            // Initialize both Alice and Bob with default passwords
            await aliceEncryptionService.initialize('alice-password', 1);
            await bobEncryptionService.initialize('bob-password', 2);
            
            // Establish demo sessions between them
            await establishDemoSessions();
            
            toast.success('Demo initialized! Alice and Bob can now chat securely.');
        } catch (error) {
            toast.error(`Failed to initialize demo: ${error}`);
        } finally {
            isInitializingDemo = false;
        }
    }

    function lockEncryption() {
        aliceEncryptionService.lock();
        bobEncryptionService.lock();
    }

    async function clearAllData() {
        if (confirm('Are you sure you want to clear all encryption data? This cannot be undone.')) {
            try {
                await aliceEncryptionService.clearAllData();
                await bobEncryptionService.clearAllData();
                toast.success('All data cleared');
            } catch (error) {
                console.error('Failed to clear data:', error);
                toast.error('Failed to clear data');
            }
        }
    }

    // Combined metrics for display
    let combinedMetrics = $derived(() => {
        if (!aliceState?.metrics || !bobState?.metrics) return null;
        
        return {
            messagesEncrypted: aliceState.metrics.messagesEncrypted + bobState.metrics.messagesEncrypted,
            messagesDecrypted: aliceState.metrics.messagesDecrypted + bobState.metrics.messagesDecrypted,
            averageEncryptionTime: (aliceState.metrics.averageEncryptionTime + bobState.metrics.averageEncryptionTime) / 2,
            averageDecryptionTime: (aliceState.metrics.averageDecryptionTime + bobState.metrics.averageDecryptionTime) / 2
        };
    });

	function formatMetric(value: number): string {
		if (value === 0) return '0ms';
		if (value < 1) return (value * 1000).toFixed(1) + 'ms';
		return value.toFixed(1) + 'ms';
	}
</script>

<svelte:head>
	<title>Double Ratchet Encryption Demo</title>
	<meta name="description" content="Demonstration of double ratchet end-to-end encryption in Svelte" />
</svelte:head>

<!-- <EncryptionTester /> -->
<div class="container mx-auto p-6 space-y-6">
	<div class="text-center space-y-4">
		<div class="flex items-center justify-center space-x-2">
			<Shield class="h-8 w-8 text-primary" />
			<h1 class="text-4xl font-bold">Double Ratchet Encryption Demo</h1>
		</div>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
			Experience Signal-grade end-to-end encryption with forward secrecy and post-compromise security
		</p>
	</div>

	{#if !isSetupComplete}
		<Card class="max-w-md mx-auto">
			<CardHeader class="text-center">
				<CardTitle>Demo Setup</CardTitle>
				<CardDescription>
					Initialize Alice and Bob with encryption to start the demo
				</CardDescription>
			</CardHeader>
			<CardContent class="text-center">
				<Button onclick={initializeDemo} disabled={isInitializingDemo} class="w-full">
					{#if isInitializingDemo}
						<div class="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
					{:else}
						<Shield class="mr-2 size-4" />
					{/if}
					Initialize Demo
				</Button>
				<p class="text-sm text-muted-foreground mt-2">
					This will set up Alice and Bob with secure encryption
				</p>
			</CardContent>
		</Card>
	{:else}
		<Tabs.Root value="chat" class="w-full">
			<Tabs.List class="grid w-full grid-cols-4">
				<Tabs.Trigger value="chat">Encrypted Chat</Tabs.Trigger>
				<Tabs.Trigger value="security">Security Info</Tabs.Trigger>
				<Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="chat" class="space-y-6">
				<div class="grid gap-6 lg:grid-cols-2">
					<div>
						<h3 class="text-lg font-semibold mb-3">Alice's Device</h3>
						<EncryptedChat 
							currentUserId="alice" 
							participantId="bob" 
							participantName="Bob"
						/>
					</div>
					<div>
						<h3 class="text-lg font-semibold mb-3">Bob's Device</h3>
						<EncryptedChat 
							currentUserId="bob" 
							participantId="alice" 
							participantName="Alice"
						/>
					</div>
				</div>

				<div class="size-2"></div>
				
				<Alert class="border-t-transparent flex justify-center bg-transparent border-0">
					<div class="flex items-center gap-2">
						<Info class="size-4" />
						<AlertDescription>
							This demo simulates two devices chatting. Each message is encrypted with a unique key.
						</AlertDescription>
					</div>
				</Alert>
			</Tabs.Content>

			<Tabs.Content value="security" class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center space-x-2">
								<Shield class="h-5 w-5" />
								<span>Encryption Status</span>
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-3">
							<div class="flex items-center justify-between">
								<span>End-to-End Encryption</span>
								<Badge variant="secondary">
									<CheckCircle class="mr-1 h-3 w-3" />
									Active
								</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>Alice's Device ID</span>
								<Badge variant="outline">{aliceState?.deviceId}</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>Bob's Device ID</span>
								<Badge variant="outline">{bobState?.deviceId}</Badge>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle class="flex items-center space-x-2">
								<Key class="h-5 w-5" />
								<span>Cryptographic Details</span>
							</CardTitle>
						</CardHeader>
						<CardContent class="space-y-3">
							<div class="text-sm space-y-2">
								<div><strong>Identity Keys:</strong> Ed25519</div>
								<div><strong>Ephemeral Keys:</strong> X25519</div>
								<div><strong>Symmetric Encryption:</strong> AES-256-GCM</div>
								<div><strong>Key Derivation:</strong> HKDF-SHA256</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Alert variant="destructive">
					<AlertTriangle class="size-4" />
					<AlertDescription>
						<strong>Demo Limitations:</strong> This is a demonstration. In production, use proper key exchange protocols and protect against side-channel attacks.
					</AlertDescription>
				</Alert>
			</Tabs.Content>

			<Tabs.Content value="metrics" class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="text-sm font-medium">Messages Encrypted</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="text-2xl font-bold">{combinedMetrics()?.messagesEncrypted || 0}</div>
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="text-sm font-medium">Messages Decrypted</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="text-2xl font-bold">{combinedMetrics()?.messagesDecrypted || 0}</div>
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="text-sm font-medium">Avg Encryption Time</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="text-2xl font-bold">
								{formatMetric(combinedMetrics()?.averageEncryptionTime || 0)}
							</div>
						</CardContent>
					</Card>
					
					<Card>
						<CardHeader class="pb-2">
							<CardTitle class="text-sm font-medium">Avg Decryption Time</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="text-2xl font-bold">
								{formatMetric(combinedMetrics()?.averageDecryptionTime || 0)}
							</div>
						</CardContent>
					</Card>
				</div>
			</Tabs.Content>

			<Tabs.Content value="settings" class="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Encryption Settings</CardTitle>
						<CardDescription>
							Manage your encryption configuration
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="font-medium">Lock Encryption</h4>
								<p class="text-sm text-muted-foreground">
									Lock the encryption service without clearing data
								</p>
							</div>
							<Button variant="outline" onclick={lockEncryption}>
								<Lock class="mr-2 size-4" />
								Lock
							</Button>
						</div>
						
						<div class="flex items-center justify-between">
							<div>
								<h4 class="font-medium">Clear All Data</h4>
								<p class="text-sm text-muted-foreground">
									Permanently delete all encryption keys and messages
								</p>
							</div>
							<Button variant="destructive" onclick={clearAllData}>
								<AlertTriangle class="mr-2 size-4" />
								Clear Data
							</Button>
						</div>
					</CardContent>
				</Card>
			</Tabs.Content>
		</Tabs.Root>

		<div class="flex justify-center">
			<Button variant="outline" size="lg" href="/chat" class="gap-2">
				<ArrowLeft class="size-4" />
				Return to Chat
			</Button>
		</div>
	{/if}
</div> 