<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { LayoutData } from './$types';
    import BackgroundAnimation from '$lib/components/BackgroundAnimation.svelte';

    let { data, children }: { data: LayoutData, children: Snippet } = $props();
</script>

<div class="fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
	<BackgroundAnimation />
</div>

<main class="relative flex min-h-screen w-full items-center justify-center">
	{@render children()}
</main>