<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { WebSocketService } from '$lib/core/websocket-service';

	import { Button } from '$lib/components/ui/button';
    import type { PageData } from './$types';   
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Phone, Video, Search, Send, MessagesSquare } from '@lucide/svelte';
    import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { cn, formatTimestamp } from '$lib/utils';
	import { Input } from '$lib/components/ui/input';
	import type { ChatMessage } from '$lib/api';
	import { afterNavigate } from '$app/navigation';

    // import { getRatchetState, storeRatchetState, loadPrivateKey, loadSignedPrekeyPrivateKey } from '$lib/core/idb-storage';
    // import { initializeRatchetState } from '$lib/core/ratchet';
    // import { x3dhDeriveSharedSecret } from '$lib/core/x3dh';
    // import { generateEphemeralKeyPair } from '$lib/core/x3dh';
    // import { generateIdentityKeyPair } from '$lib/core/crypto-utils';
    import { defaultDoubleRatchetConfig } from '$lib/core/ratchet-config';
    import { strategies } from '$lib/core/kdf-strategies';

    let { data }: { data: PageData } = $props();

    let messageInput: string = $state('');

    let messages = $derived(data.messages);

    let ws: WebSocketService;
    let wsInitialized = $state(false);
    
    let ratchetState: any = null;

    // Helper to load or initialize ratchet state for this contact
    // async function ensureRatchetState() {
    //     // Here is wehere the Config is applied
    //     initializeRatchetState(defaultDoubleRatchetConfig, data.contactData.id);
    // }

    afterNavigate(async () => {
        console.log('Component mounted, initializing WebSocket');
        if (ws) ws.disconnect();
        // await ensureRatchetState();
        await initWebSocket();
    });
    
    async function initWebSocket() {
        try {
            ws = new WebSocketService(data.user?.id as number);
            await ws.connect(async (message) => { // Denis: making this anonymous function asynchronous techincally makes the RatchetState prone to race conditions, but this is only the case for high message concurrency, which is not expected in our use case
                console.log('WebSocket message received:', message);
                
                // Check if it's a new message to avoid duplicates
                if (!messages.some((m: ChatMessage) => m.id === message.id)) {
                    // Decrypt incoming message
                        // const { plaintext, newState } = await ratchetState.ratchetDecrypt(ratchetState, message.ciphertext, message.header);
                        // ratchetState = newState;
                        // await ratchetState.saveRatchetState(data.contactData.id, ratchetState);
                        messages = [...messages, { ...message }];
                    
                }
            });
            wsInitialized = true;
            console.log('WebSocket initialized successfully');
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
        }
    }
    
    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;
        
        console.log('Sending message to:', data.contactData?.id);
        
        // Encrypt the message
        // const { ciphertext, header, newState } = await ratchetState.ratchetEncrypt(ratchetState, messageInput);
        // ratchetState = newState;
        // await ratchetState.saveRatchetState(data.contactData.id, ratchetState);
        
        const newMessage = {
            senderId: data.user?.id,
            recipientId: data.contactData?.id,
            content: messageInput,
            // header,
            timestamp: new Date().toISOString()
        };
        
        // Add to local messages array (show plaintext locally)
        messages = [...messages, { ...newMessage, content: messageInput }];
        
        // Send via WebSocket
        ws.sendMessage('/app/chat', newMessage);
        
        // Clear input
        messageInput = '';
    };

    const isSelfMessage = (message: ChatMessage):boolean => {
        const userId = data.user?.id

        return (userId === message.senderId)
    }
</script>

<main class="flex flex-col h-screen">
    <!-- Contact Header -->
    <div class="flex items-center justify-between p-4 border-b h-20">
        <div class="flex items-center gap-3">
            <Avatar.Root class="size-10">
                <Avatar.Image src="/avatar_placeholder.png" alt={data.contactData?.username} />
            </Avatar.Root>
            <div>
            <h2 class="font-semibold">{data.contactData?.username}</h2>
            <p class="text-xs text-muted-foreground">{data.contactData?.online ? "Online" : "Offline"}</p>
            </div>
        </div>
        <div class="flex gap-1">
            <Button variant="ghost" size="icon">
                <Phone class="size-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <Video class="size-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <Search class="size-5" />
            </Button>
        </div>
    </div>

    <!-- Chat Area - will expand to fill available space -->
    <ScrollArea class="flex-1 p-4 overflow-y-auto" >
        <div class="flex flex-col gap-4 pb-2">
            {#if messages.length <= 0}
                <div class="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div class="bg-muted/30 rounded-full p-6 mb-4">
                        <MessagesSquare class="text-muted-foreground" size={32} />
                    </div>
                    <h3 class="text-lg font-medium text-foreground mb-1">No messages yet</h3>
                    <p class="text-sm text-muted-foreground max-w-xs mb-6">
                        Start a conversation with {data.contactData?.username || 'this contact'} by sending the first message.
                    </p>
                    <div class="w-2/3 border-t border-muted-foreground/10"></div>
                </div>
            {/if}

            {#each messages as message}
                <div
                    class={cn(
                        "flex flex-col max-w-[80%]",
                        isSelfMessage(message) ? "ml-auto items-end" : "mr-auto items-start",
                    )}
                >
                <div
                    class={cn(
                        "rounded-lg px-4 py-2",
                        isSelfMessage(message)  ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                >
                    {message.content}
                </div>
                <span class="text-xs text-muted-foreground mt-1">{formatTimestamp(message.timestamp as string)}</span>
            </div>
            {/each}
        </div>
    </ScrollArea>

    <!-- Message Input - fixed at bottom -->
    <div class="p-4 border-t bg-white">
        <div class="flex gap-2">
          <Input
            placeholder="Type a message..."
            bind:value={messageInput}
            class="flex-1"
            onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          />
          <Button size="icon" onclick={handleSendMessage}>
            <Send class="size-5" />
          </Button>
        </div>
    </div>
</main>