<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { encryptionService } from '$lib/encryption/encryption-service.js';
	import { toast } from 'svelte-sonner';
	import { AlertCircle, Key, Shield } from '@lucide/svelte';

	let password = $state('')
	let confirmPassword = $state('')
	let deviceId =$state(Math.floor(Math.random() * 1000000));
	let isLoading = $state(false);
	let mode = $state('setup');

	let encryptionErr: null | string = $state(null)

	encryptionService.state.subscribe((state)=> {
		encryptionErr = state.error
	})

	let passwordsMatch =$derived(password === confirmPassword);
	let canProceed = $derived(password.length >= 8 && (mode === 'unlock' || passwordsMatch));

	async function handleSetup() {
		if (!canProceed) return;

		isLoading = true;
		try {
			if (mode === 'setup') {
				await encryptionService.initialize(password, deviceId);
				toast.success('Encryption setup completed successfully!');
			} else {
				await encryptionService.unlock(password, deviceId);
				toast.success('Encryption unlocked successfully!');
			}
		} catch (error) {
			toast.error(`Failed to ${mode === 'setup' ? 'setup' : 'unlock'} encryption: ${error}`);
		} finally {
			isLoading = false;
		}
	}

	function toggleMode() {
		mode = mode === 'setup' ? 'unlock' : 'setup';
		password = '';
		confirmPassword = '';
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
				<Shield class="h-6 w-6 text-primary" />
			</div>
			<CardTitle class="text-2xl">
				{mode === 'setup' ? 'Setup Encryption' : 'Unlock Encryption'}
			</CardTitle>
			<CardDescription>
				{mode === 'setup' 
					? 'Secure your messages with end-to-end encryption' 
					: 'Enter your password to unlock encrypted messaging'}
			</CardDescription>
		</CardHeader>
		
		<CardContent class="space-y-4">
			{#if encryptionErr}
				<Alert variant="destructive">
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>{encryptionErr}</AlertDescription>
				</Alert>
			{/if}

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					type="password"
					placeholder="Enter your encryption password"
					bind:value={password}
					class="w-full"
					disabled={isLoading}
				/>
				{#if password.length > 0 && password.length < 8}
					<p class="text-sm text-muted-foreground">
						Password must be at least 8 characters
					</p>
				{/if}
			</div>

			{#if mode === 'setup'}
				<div class="space-y-2">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						placeholder="Confirm your password"
						bind:value={confirmPassword}
						class="w-full"
						disabled={isLoading}
					/>
					{#if confirmPassword.length > 0 && !passwordsMatch}
						<p class="text-sm text-destructive">
							Passwords do not match
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="deviceId">Device ID</Label>
					<Input
						id="deviceId"
						type="number"
						bind:value={deviceId}
						class="w-full"
						disabled={isLoading}
					/>
					<p class="text-xs text-muted-foreground">
						A unique identifier for this device
					</p>
				</div>
			{/if}

			<Button 
				class="w-full" 
				disabled={!canProceed || isLoading}
				onclick={handleSetup}
			>
				{#if isLoading}
					<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
				{:else}
					<Key class="mr-2 h-4 w-4" />
				{/if}
				{mode === 'setup' ? 'Setup Encryption' : 'Unlock'}
			</Button>

			<div class="text-center">
				<Button variant="link" onclick={toggleMode} disabled={isLoading}>
					{mode === 'setup' ? 'Already have encryption setup?' : 'Need to setup encryption?'}
				</Button>
			</div>

			{#if mode === 'setup'}
				<Alert>
					<Shield class="h-4 w-4" />
					<AlertDescription>
						Your password is used to encrypt your keys locally. If you lose it, you won't be able to decrypt your messages.
					</AlertDescription>
				</Alert>
			{/if}
		</CardContent>
	</Card>
</div> 