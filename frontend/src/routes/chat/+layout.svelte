<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { Search, LogOut, Settings, UserPlus, Shield, UserX, Users } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { cn, formatTimestamp, fuzzySearch } from '$lib/utils';
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import type { ContactDTO } from '$lib/api/index.js';
	import AddFriendsDialog from './(components)/add-friends-dialog.svelte';

    let { children, data } = $props();

    let contacts: ContactDTO[] = $derived(data.contacts);
    let searchQuery: string = $state('');
    let selectedContact = $state<ContactDTO>();

    const onSelectContact = (clickedContact: ContactDTO) => {
        selectedContact = clickedContact
        goto(`/chat/${selectedContact.id}`)
    }

    let addFriendsDialogState: boolean = $state(false);

    function setAddFriendsDialogState(state:boolean) {
        addFriendsDialogState = state
    }
</script>

<AddFriendsDialog bind:open={addFriendsDialogState} />

<main class="flex">
    <!-- Conversations Side Area -->
    <div class="relative h-screen w-1/5 border-r border-gray-300 shrink-0">
        <!-- Logo -->
        <div class="border-b h-20 p-2 flex items-center justify-center">
            <img src="/logo.png" alt="" class="h-12">
        </div>

        <!-- Search bar -->
        <div class="p-4">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                class="pl-9"
                bind:value={searchQuery}
              />
            </div>
        </div>

        <ScrollArea class="flex-1">
            <div class="px-2">
                {#if contacts.length <= 0}
                    <div class="w-full h-[80vh] flex flex-col justify-center items-center text-center space-y-4 text-muted-foreground">
                        <UserX size={40} />
                        <div class="text-xl font-medium">No contacts found</div>
                        <p class="max-w-xs text-sm text-muted-foreground">Start a conversation by adding a new contact to your list.</p>
                    </div>
                {/if}


				{#each contacts.filter((contact) => {
                    if (!searchQuery.trim()) return true;
                    
                    return fuzzySearch(contact.username, searchQuery)
                }) as contact}
                    <button
                        class={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                            selectedContact?.id === contact.id ? "bg-muted" : "hover:bg-muted/50",
                        )}
                        onclick={() => onSelectContact(contact)}
                    >
                        <div class="relative">
                            <Avatar.Root class="size-10">
                                <Avatar.Image src={"/avatar_placeholder.png"} alt={contact.username} />
                            </Avatar.Root>

                            {#if contact.online}
                                <span class="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-background"></span>
                            {/if}
                        </div>
                        
                        <div class="flex-1 text-left">
                            <div class="flex justify-between items-center">
                                <h3 class="font-medium">{contact.username}</h3>
                                {#if contact.messageTimestamp}
                                    <span class="text-xs text-muted-foreground">{formatTimestamp(contact.messageTimestamp)}</span>
                                {/if}
                            </div>
                            <!-- This needs polish, for convience i leave it with max-w-36 -->
                            <p class="text-sm text-muted-foreground truncate max-w-36">{contact.lastMessage}</p>
                        </div>
                        <!-- Alex: we disabled unreda for now sicne we don't have the data -->
                        <!-- {#if contact.unread > 0}
                            <div class="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <span class="text-xs text-primary-foreground">{contact.unread}</span>
                            </div>
                        {/if} -->
                    </button>
                {/each}
              </div>
        </ScrollArea>
    </div>
    <!-- Render chat interface -->
    <div class="relative h-screen w-3/5">
        {@render children()}
     </div>

    <!-- Right side bar -->
    <div class="relative flex flex-col h-screen w-1/5 border-l border-gray-300 shrink-0">
        <!-- Profile Section -->
        <div class="flex-1">
            <!-- Section Header -->
            <div class="bg-muted/40 px-6 py-3 border-b h-20 flex justify-center items-center">
                <h2 class="text-lg font-medium text-center tracking-wide">Your Account</h2>
            </div>
            
            <!-- Profile Picture and Info -->
            <div class="pt-8 pb-6 flex flex-col items-center">
                <div class="relative">
                    <Avatar.Root class="size-28 rounded-full border-2 border-primary/10 shadow-sm">
                        <Avatar.Image src={"/profile_picture.png"} alt={"User profile"} />
                        <Avatar.Fallback>SU</Avatar.Fallback>
                    </Avatar.Root>
                    <div class="absolute bottom-1 right-1 bg-green-500 size-4 rounded-full border-2 border-white"></div>
                </div>
                <h2 class="font-semibold text-lg mt-4">{data.user?.username}</h2>
                <span class="text-sm text-muted-foreground">online</span>
            </div>
            
            <Separator/>
            
            <!-- Settings -->
            <div class="px-6 py-4">
                <h3 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Account Settings</h3>
                <div class="space-y-2">

                    <Button variant="ghost" class="w-full justify-start" size="sm" onclick={() => setAddFriendsDialogState(true)}>
                        <UserPlus class="mr-2 size-4" />
                        Add Friends
                    </Button>
                    <Button variant="ghost" class="w-full justify-start" size="sm" href="/encryption-demo">
                        <Shield class="mr-2 size-4" />
                        Double Ratchet Demo
                    </Button>
                    <Button variant="ghost" class="w-full justify-start" size="sm" href="/chat/requests">
                        <Users class="mr-2 size-4" />
                        Friend Requests
                        {#if data.requestsCount > 0}
                            <div class="size-5 rounded-full bg-primary flex items-center justify-center">
                                <span class="text-xs text-primary-foreground">{data.requestsCount}</span>
                            </div>
                        {/if}
                    </Button>
                </div>
            </div>
            
            <Separator/>
        </div>
        
        <!-- Logout  -->
        <div class="p-4">
            <Button variant="destructive" class="w-full gap-2" size="default" href="/logout">
                <LogOut class="size-4" />
                Log Out
            </Button>
        </div>
    </div>
</main>