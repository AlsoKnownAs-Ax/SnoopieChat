<script lang="ts">
	import '../app.css';
    import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();
</script>

<Toaster richColors position="top-center" closeButton />
{@render children()}
