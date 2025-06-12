<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input';
	import { defaultFormEnhance } from '$lib/core/form/defaultFormEnhance';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();

    let inputValue: string = $state('');
    let isLoading: boolean = $state(false);

    const onFormResult = (event: any) => {
        const { result } = event.detail
        console.log("received result: ", result);

        if(result.error){
            toast.error(result.error)
        }else{
            toast.success(result.message)
            inputValue = ''
        }
        invalidateAll()
        isLoading = false;
    }
</script>

<Dialog.Root bind:open>
	<Dialog.Overlay class="bg-black/50 backdrop-blur-sm" />
	<Dialog.Content>
        <div class="space-y-6">
            <Dialog.Header>
                <Dialog.Title class="text-xl font-semibold text-gray-900">Add a Friend</Dialog.Title>
                <Dialog.Description class="text-sm text-gray-600">
                    You can add people by their username.
                </Dialog.Description>
            </Dialog.Header>
    
            <form action="/actions/add_friend" method="POST" use:enhance={defaultFormEnhance} class="space-y-4" onformresult={onFormResult} onsubmit={() => (isLoading = true)}>
                <div>
                    <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <Input id="username" name="username" placeholder="e.g. john_doe" class="w-full" required bind:value={inputValue} />
                </div>
    
                <div class="flex justify-end gap-2">
                    <Button type="button" onclick={() => (open = false)} variant="ghost" disabled={isLoading}>Cancel</Button>
                    <Button type="submit" class="bg-green-600 text-white hover:bg-green-500" loading={isLoading}>Add Friend</Button>
                </div>
            </form>
        </div>
	</Dialog.Content>
</Dialog.Root>
