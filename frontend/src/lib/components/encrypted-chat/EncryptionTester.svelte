<script lang="ts">
	import { encryptionService } from '$lib/encryption';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { AlertCircle } from '@lucide/svelte';

	let recipientId = $state('user2');
	let message = $state('Hello, this is an encrypted message!');
	let preKeyBundleJSON = $state('');
	let importedPreKeyBundle = $state('');
	let isLoading = $state(false);

	// Subscribe to encryption service state
	let encryptionState: any = $state(null);
	encryptionService.state.subscribe((state) => {
		encryptionState = state;
		console.log('Encryption state updated:', state);
	});

	// Subscribe to messages
	let messages: any = $state([]);
	encryptionService.messages.subscribe((messageStore) => {
		// Get messages for the current conversation
		const conversationMessages = encryptionService.getConversationMessages(recipientId, 'user1');
		messages = conversationMessages;
		console.log('Messages updated:', conversationMessages);
	});

	async function createTestSession() {
		console.log('createTestSession clicked');
		console.log('Current encryption state:', encryptionState);
		
		isLoading = true;
		try {
			await encryptionService.createTestSession(recipientId);
			toast.success('Test session created successfully!');
		} catch (error) {
			console.error('createTestSession error:', error);
			toast.error(`Failed to create test session: ${error}`);
		} finally {
			isLoading = false;
		}
	}

	async function createBidirectionalTestSession() {
		console.log('createBidirectionalTestSession clicked');
		
		isLoading = true;
		try {
			// Create session from user1 to recipientId
			await encryptionService.createTestSession(recipientId);
			// Create session from recipientId to user1 (for demo messages)
			await encryptionService.createTestSession('user1');
			toast.success('Bidirectional test sessions created successfully!');
		} catch (error) {
			console.error('createBidirectionalTestSession error:', error);
			toast.error(`Failed to create bidirectional test sessions: ${error}`);
		} finally {
			isLoading = false;
		}
	}

	async function exportPreKeyBundle() {
		console.log('exportPreKeyBundle clicked');
		console.log('Current encryption state:', encryptionState);
		
		isLoading = true;
		try {
			preKeyBundleJSON = await encryptionService.getExportablePreKeyBundle();
			console.log('Pre-key bundle exported successfully');
			toast.success('Pre-key bundle exported!');
		} catch (error) {
			console.error('exportPreKeyBundle error:', error);
			toast.error(`Failed to export pre-key bundle: ${error}`);
		} finally {
			isLoading = false;
		}
	}

	async function importAndEstablishSession() {
		if (!importedPreKeyBundle.trim()) {
			toast.error('Please paste a pre-key bundle JSON');
			return;
		}

		isLoading = true;
		try {
			await encryptionService.establishSessionFromJSON(recipientId, importedPreKeyBundle);
			toast.success('Session established from imported pre-key bundle!');
		} catch (error) {
			toast.error(`Failed to establish session: ${error}`);
		} finally {
			isLoading = false;
		}
	}

	async function sendMessage() {
		if (!message.trim()) {
			toast.error('Please enter a message');
			return;
		}

		isLoading = true;
		try {
			const currentUser = 'user1'; // In a real app, this would come from auth
			await encryptionService.sendMessage(recipientId, message, currentUser);
			toast.success('Encrypted message sent successfully!');
			message = '';
		} catch (error) {
			toast.error(`Failed to send message: ${error}`);
		} finally {
			isLoading = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard!');
	}
</script>

<div class="space-y-6">
	<Card>
		<CardHeader>
			<CardTitle>Encryption Testing</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<!-- Encryption Status Display -->
			{#if encryptionState}
				<Alert variant={encryptionState.isUnlocked ? "default" : "destructive"}>
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>
						<div class="space-y-1">
							<div><strong>Status:</strong> {encryptionState.isUnlocked ? 'Unlocked ✓' : 'Locked ✗'}</div>
							<div><strong>Initialized:</strong> {encryptionState.isInitialized ? 'Yes ✓' : 'No ✗'}</div>
							<div><strong>Device ID:</strong> {encryptionState.deviceId || 'None'}</div>
							{#if encryptionState.error}
								<div class="text-destructive"><strong>Error:</strong> {encryptionState.error}</div>
							{/if}
						</div>
					</AlertDescription>
				</Alert>
			{:else}
				<Alert variant="destructive">
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>
						Encryption service not initialized. Please complete the encryption setup first.
					</AlertDescription>
				</Alert>
			{/if}

			<div>
				<Label for="recipient">Recipient ID</Label>
				<Input id="recipient" bind:value={recipientId} placeholder="user2" />
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Option 1: Quick Test Session -->
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Option 1: Quick Test</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<p class="text-sm text-muted-foreground">
							Create a test session with mock keys (easiest for development)
						</p>
						<Button onclick={createTestSession} disabled={isLoading} class="w-full">
							Create Test Session (One-way)
						</Button>
						<Button onclick={createBidirectionalTestSession} disabled={isLoading} class="w-full" variant="outline">
							Create Bidirectional Test Sessions
						</Button>
						<p class="text-xs text-muted-foreground">
							Use bidirectional for demo messages and two-way chat
						</p>
					</CardContent>
				</Card>

				<!-- Option 2: Real Key Exchange -->
				<Card>
					<CardHeader>
						<CardTitle class="text-lg">Option 2: Real Key Exchange</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<p class="text-sm text-muted-foreground">
							Test with real pre-key bundles (for 2 browser tabs)
						</p>
						
						<Button onclick={exportPreKeyBundle} disabled={isLoading} class="w-full">
							Export My Pre-Key Bundle
						</Button>

						{#if preKeyBundleJSON}
							<div class="space-y-2">
								<Label class="text-sm font-medium">My Pre-Key Bundle (copy this):</Label>
								<div class="relative">
									<Textarea 
										value={preKeyBundleJSON} 
										readonly 
										class="text-xs font-mono h-32"
									/>
									<Button 
										size="sm" 
										variant="outline" 
										class="absolute top-2 right-2"
										onclick={() => copyToClipboard(preKeyBundleJSON)}
									>
										Copy
									</Button>
								</div>
							</div>
						{/if}

						<div class="space-y-2">
							<Label for="import-bundle">Paste Other User's Pre-Key Bundle:</Label>
							<Textarea 
								id="import-bundle"
								bind:value={importedPreKeyBundle} 
								placeholder="Paste the other user's pre-key bundle JSON here..."
								class="text-xs font-mono h-32"
							/>
						</div>

						<Button 
							onclick={importAndEstablishSession} 
							disabled={isLoading || !importedPreKeyBundle.trim()} 
							class="w-full"
						>
							Establish Session from Bundle
						</Button>
					</CardContent>
				</Card>
			</div>

			<!-- Send Message -->
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Send Encrypted Message</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<div>
						<Label for="message">Message</Label>
						<Textarea 
							id="message"
							bind:value={message} 
							placeholder="Type your message here..."
						/>
					</div>
					<Button onclick={sendMessage} disabled={isLoading || !message.trim()} class="w-full">
						Send Encrypted Message
					</Button>
				</CardContent>
			</Card>

			<!-- Message Display -->
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Conversation with {recipientId}</CardTitle>
				</CardHeader>
				<CardContent>
					{#if messages.length === 0}
						<p class="text-sm text-muted-foreground text-center py-8">
							No messages yet. Send a message to see it here!
						</p>
					{:else}
						<div class="space-y-3 max-h-60 overflow-y-auto">
							{#each messages as msg}
								<div class="p-3 rounded-lg {msg.senderId === 'user1' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'}">
									<div class="flex justify-between items-start mb-1">
										<span class="text-sm font-medium">{msg.senderId === 'user1' ? 'You' : msg.senderId}</span>
										<span class="text-xs opacity-70">{new Date(msg.timestamp).toLocaleTimeString()}</span>
									</div>
									<p class="text-sm">{msg.plaintext}</p>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</CardContent>
	</Card>
</div>

<style>
	/* Add any custom styles here */
</style> 