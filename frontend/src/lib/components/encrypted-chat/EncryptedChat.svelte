<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getEncryptionServiceForUser } from '$lib/encryption/demo-services.js';
	import type { EncryptionState } from '$lib/encryption/encryption-service.js';
	import { toast } from 'svelte-sonner';
	import { Send, Shield, Lock, Clock, User } from '@lucide/svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { DecryptedMessage } from '$lib/encryption/types.js';

	interface Props {
		currentUserId: string,
		participantId: string,
		participantName: string
	}

	let {
		currentUserId = 'user-1',
		participantId = 'user-2',
		participantName = 'Chat Partner'
	}: Props = $props()

	let messageText = $state('');
	let isLoading = $state(false);
	let messagesContainer: HTMLElement;

	// Get the encryption service for this user
	const encryptionService = getEncryptionServiceForUser(currentUserId);

	let messages = $state(encryptionService.getConversationMessages(participantId, currentUserId))
	let encryptionState: EncryptionState | null = $state(null)

	let unsubscribeState: (() => void) | null = null;
	let unsubscribeMessages: (() => void) | null = null;

	onMount(() => {
		// Subscribe to state and messages
		unsubscribeState = encryptionService.state.subscribe((state) => {
			encryptionState = state;
		});

		unsubscribeMessages = encryptionService.messages.subscribe((messageStore) => {
			// Update messages when the store changes
			const newMessages = encryptionService.getConversationMessages(participantId, currentUserId);
			console.log(`${currentUserId}: Messages updated, count: ${newMessages.length}`);
			messages = newMessages;
		});

		// Auto-scroll to bottom when new messages arrive
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	onDestroy(() => {
		// Clean up subscriptions
		if (unsubscribeState) unsubscribeState();
		if (unsubscribeMessages) unsubscribeMessages();
	});

	$effect(()=> {
		if (messages.length && messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 100);
		}
	})

	async function sendMessage() {
		if (!messageText.trim() || isLoading || !encryptionState!.isUnlocked) return;

		const text = messageText.trim();
		messageText = '';
		isLoading = true;

		try {
			await encryptionService.sendMessage(participantId, text, currentUserId);
			toast.success('Message sent securely');
		} catch (error) {
			toast.error(`Failed to send message: ${error}`);
			messageText = text; // Restore message on error
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString([], { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}

	async function simulateReceiveMessage() {
		// For demo purposes - simulate receiving an encrypted message
		try {
			const demoMessage = `Demo encrypted message at ${new Date().toLocaleTimeString()}`;
			await encryptionService.sendMessage(currentUserId, demoMessage, participantId);
			toast.success('Demo message received');
		} catch (error) {
			toast.error(`Failed to simulate message: ${error}`);
		}
	}
</script>

<Card class="flex h-full max-h-[600px] w-full flex-col">
	<CardHeader class="flex-shrink-0 border-b">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					<User class="h-5 w-5 text-primary" />
				</div>
				<div>
					<CardTitle class="text-lg">{participantName}</CardTitle>
					<div class="flex items-center space-x-2">
						{#if encryptionState?.isUnlocked}
							<Badge variant="secondary" class="text-xs">
								<Shield class="mr-1 h-3 w-3" />
								End-to-End Encrypted
							</Badge>
							<Badge variant="outline" class="text-xs">
								<Lock class="mr-1 h-3 w-3" />
								Device {encryptionState?.deviceId}
							</Badge>
						{:else}
							<Badge variant="destructive" class="text-xs">
								<Shield class="mr-1 h-3 w-3" />
								Not Encrypted
							</Badge>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Demo button for testing -->
			<!-- <Button variant="outline" size="sm" onclick={simulateReceiveMessage}>
				Demo Message
			</Button> -->
		</div>
	</CardHeader>

	<CardContent class="flex flex-1 flex-col p-0">
		<!-- Messages Container -->
		<div 
			bind:this={messagesContainer}
			class="flex-1 overflow-y-auto p-4 space-y-3"
		>
			{#if messages.length === 0}
				<div class="flex h-full items-center justify-center text-center">
					<div class="space-y-2">
						<Shield class="mx-auto h-12 w-12 text-muted-foreground/50" />
						<p class="text-sm text-muted-foreground">
							No messages yet. Start a secure conversation!
						</p>
					</div>
				</div>
			{:else}
				{#each messages as message}
					<div 
						class="flex {message.senderId === currentUserId ? 'justify-end' : 'justify-start'}"
					>
						<div 
							class="max-w-[80%] rounded-lg px-3 py-2 {
								message.senderId === currentUserId 
									? 'bg-primary text-primary-foreground' 
									: 'bg-muted'
							}"
						>
							<p class="text-sm whitespace-pre-wrap">{message.plaintext}</p>
							<div class="mt-1 flex items-center justify-end space-x-1 text-xs opacity-70">
								<Shield class="h-3 w-3" />
								<Clock class="h-3 w-3" />
								<span>{formatTime(message.timestamp)}</span>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Message Input -->
		<div class="flex-shrink-0 border-t p-4">
			{#if !encryptionState?.isUnlocked}
				<div class="text-center">
					<p class="text-sm text-muted-foreground mb-2">
						Encryption is not unlocked. Please unlock to send messages.
					</p>
				</div>
			{:else}
				<div class="flex space-x-2">
					<Textarea
						placeholder="Type your encrypted message..."
						bind:value={messageText}
						onkeydown={handleKeydown}
						disabled={isLoading}
						class="min-h-[40px] max-h-[120px] resize-none"
					/>
					<Button 
						onclick={sendMessage}
						disabled={!messageText.trim() || isLoading}
						class="px-3"
					>
						{#if isLoading}
							<div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
						{:else}
							<Send class="h-4 w-4" />
						{/if}
					</Button>
				</div>
				
				<div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
					<div class="flex items-center space-x-1">
						<Shield class="h-3 w-3" />
						<span>Messages are end-to-end encrypted</span>
					</div>
					<div class="flex items-center space-x-2">
						<span>Encrypted: {encryptionState.metrics.messagesEncrypted}</span>
						<span>•</span>
						<span>Decrypted: {encryptionState.metrics.messagesDecrypted}</span>
					</div>
				</div>
			{/if}
		</div>
	</CardContent>
</Card> 