<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { Mail, Lock, LogIn, EyeOff, Eye } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { defaultFormEnhance } from '$lib/core/form/defaultFormEnhance';

	let { data }: { data: PageData } = $props();

	let isLoading: boolean = $state(false);
	let showPassword: boolean = $state(false);

	const setIsLoading = (state:boolean):void => {
		isLoading = state
	}
</script>

<Card.Root class="mx-auto w-full max-w-md border-2 p-1 shadow-lg">
	<Card.Header class="space-y-3">
		<div class="flex flex-col items-center">
			<img src="/logo.png" alt="Logo" class="mb-2 h-12" />
		</div>
	</Card.Header>
	<Separator class="mt-2" />
	<div class="mt-4 flex w-full flex-col items-center justify-center space-y-2">
		<Card.Title class="text-2xl font-semibold">Welcome Back</Card.Title>
		<Card.Description class="text-center">Sign in to your account to continue</Card.Description>
	</div>

	<Card.Content class="pt-5">
		<form 
			action="?/login" 
			method="POST"
			class="space-y-4" 
			use:enhance={defaultFormEnhance}
			onsubmit={() => setIsLoading(true)}
			onformresult={() => setIsLoading(false)}
		>
			<div class="space-y-2">
				<Label for="email" class="text-sm font-medium">Email</Label>
				<div class="relative">
					<Mail class="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="johndoe@example.com"
						class="pl-10"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="password" class="text-sm font-medium">Password</Label>
					<a href="/auth/reset-password" class="text-xs text-primary hover:underline">
						Forgot password?
					</a>
				</div>
				<div class="relative">
					<Lock class="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
					<Input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						class="pl-10"
						placeholder="••••••••••••••"
					/>
					<button
						type="button"
						class="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{#if showPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<Button type="submit" class="w-full gap-2" loading={isLoading}>
				{#if isLoading}
					Signing in...
				{:else}
					<LogIn class="size-4" />
					Sign in
				{/if}
			</Button>
		</form>
	</Card.Content>

	<Card.Footer class="flex flex-col">
		<div class="text-center text-sm">
			Don't have an account?
			<a href="/auth/register" class="font-medium text-primary hover:underline"> Create one </a>
		</div>
	</Card.Footer>
</Card.Root>
