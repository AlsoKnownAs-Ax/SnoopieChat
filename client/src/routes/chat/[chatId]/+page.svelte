<script lang="ts">
	import { Button } from '$lib/components/ui/button';
    import type { PageData } from './$types';
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Phone, Video, Search, Send } from '@lucide/svelte';
    import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { cn } from '$lib/utils';
	import { Input } from '$lib/components/ui/input';

    let { data }: { data: PageData } = $props();

    let messageInput: string = $state('');

    let messages = $derived(data.messages)

    const handleSendMessage = async () => {
        if(messageInput.trim()){
            const newMessage = {
                id: messages.length + 1,
                content: messageInput,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                isSelf: true
            }

            messages = [...messages, newMessage];
            messageInput = ''
        }
    }
</script>

<main class="flex flex-col h-screen">
    <!-- Contact Header -->
    <div class="flex items-center justify-between p-4 border-b h-20">
        <div class="flex items-center gap-3">
            <Avatar.Root class="size-10">
                <Avatar.Image src={data.contactData?.avatar || "/placeholder.svg"} alt={data.contactData?.name} />
            </Avatar.Root>
            <div>
            <h2 class="font-semibold">{data.contactData?.name}</h2>
            <p class="text-xs text-muted-foreground">{data.contactData?.online ? "Online" : "Offline"}</p>
            </div>
        </div>
        <div class="flex gap-1">
            <Button variant="ghost" size="icon">
                <Phone class="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <Video class="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <Search class="h-5 w-5" />
            </Button>
        </div>
    </div>

    <!-- Chat Area - will expand to fill available space -->
    <ScrollArea class="flex-1 p-4 overflow-y-auto" >
        <div class="flex flex-col gap-4 pb-2">
            {#each messages as message}
                <div
                    class={cn(
                    "flex flex-col max-w-[80%]",
                    message.isSelf ? "ml-auto items-end" : "mr-auto items-start",
                    )}
                >
                <div
                    class={cn(
                        "rounded-lg px-4 py-2",
                        message.isSelf ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                >
                {message.content}
                </div>
                <span class="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
            </div>
            {/each}
        </div>
    </ScrollArea>

    <!-- Message Input - fixed at bottom -->
    <div class="p-4 border-t bg-white">
        <form onsubmit={handleSendMessage} class="flex gap-2">
          <Input
            placeholder="Type a message..."
            bind:value={messageInput}
            class="flex-1"
          />
          <Button type="submit" size="icon">
            <Send class="size-5" />
          </Button>
        </form>
    </div>
</main>