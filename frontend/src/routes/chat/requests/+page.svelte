<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Check, User, X } from '@lucide/svelte';
    import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { defaultFormEnhance } from '$lib/core/form/defaultFormEnhance';
	import { invalidateAll } from '$app/navigation';

    let { data }: { data: PageData } = $props();

    function handleFormResult(event:any) {
        const { result } = event.detail

        if(result.type === 'success'){
            invalidateAll()
        }
    }
</script>

<div class="mt-8 space-y-1">
    {#if data.requests.length === 0}
        <div class="text-muted-foreground text-center italic">No friend requests</div>
    {:else}
        <p class="text-foreground text-center font-bold">Friend Requests</p>
    {/if}


    {#each data.requests as request}
        <Card.Root class="border-none shadow-md hover:opacity-70">
            <Card.Content class="flex items-center justify-between gap-4 py-4 px-6">
            <div class="flex items-center gap-4">
                <User class="text-primary" />
                <div class="font-medium">{request.username}</div>
            </div>
            <form action="?/accept_request" method="POST" use:enhance={defaultFormEnhance} class="flex gap-2" onformresult={handleFormResult}>
                <Button variant="ghost" class="text-green-400 hover:bg-green-500/10" type="submit">
                    <Check class="size-4" />
                </Button>

                <Button variant="ghost" class="text-red-400 hover:bg-red-500/10" formaction="?/reject_request" type="submit">
                    <X class="size-4" />
                </Button>

                <input type="hidden" value={request.id} name="request_id">
            </form>
            </Card.Content>
        </Card.Root>
    {/each}
</div>