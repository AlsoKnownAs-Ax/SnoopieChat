<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Mail, Lock, KeyRound, EyeOff, Eye, CircleAlert, User } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { defaultFormEnhance } from '$lib/core/form/defaultFormEnhance';
	import { initializeIdenetityKeyPair, initializeSignedPreKeyPair } from '$lib/core/key-init';
	import { exportPublicKey, generateRSAPublicKey } from '$lib/core/crypto-utils';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let isFormValid: boolean = $state(true);
	//Alex: Not the best approach but it works
	$effect(() => {
		const allConstraintsPassed = constrains.every((constrain) => constrain.isPassed());
		const allFieldsFilled = email.length > 0 && username.length > 0;
		const passwordsMatch = repeatPassword === password;

		isFormValid = allConstraintsPassed && allFieldsFilled && passwordsMatch;
	});

	let isLoading: boolean = $state(false);
	const setIsLoading = (state: boolean): void => {
		isLoading = state;
	};
	let showPassword: boolean = $state(false);

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let repeatPassword = $state('');

	type Constrain = {
		error: string;
		isPassed: () => boolean;
	};

	const constrains: Constrain[] = [
		{
			error: 'Password must be at least 8 characters long.',
			isPassed: () => password.length > 8
		},
		{
			error: 'Password must contain at least one uppercase letter.',
			isPassed: () => /[A-Z]/.test(password)
		},
		{
			error: 'Password must contain at least one lowercase letter.',
			isPassed: () => /[a-z]/.test(password)
		},
		{
			error: 'Password must contain at least one special character.',
			isPassed: () => /[[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
		}
	];

    let serializedPublicKey: string = $state('');
	let serializedIdentityPublicKey: string = $state('')
    
    onMount(async () => {
        try {
            const identityPublicKey = await initializeIdenetityKeyPair();
            // await initializeSignedPreKeyPair();
            const publicKeyObject = await exportPublicKey(identityPublicKey);
			console.log("IdenittyPublicKeY: ", identityPublicKey);
			console.log("PublciKeyObject: ", publicKeyObject);
			
            // Serialize the key object to JSON string

			serializedIdentityPublicKey = JSON.stringify(publicKeyObject)
			serializedPublicKey = await generateRSAPublicKey();
            console.log("Generated public key:", serializedPublicKey);
        } catch (error) {
            console.error("Error generating keys:", error);
        }
    });
	function onRegisterFormSubmit() {
		setIsLoading(true)
	}

	const onFormResult = async (event: any) => {
		setIsLoading(false);
		const { result } = event.detail

		if(result.type === 'success'){
			console.log("Initializing signed pre key paris...");
			await initializeSignedPreKeyPair(username);
			console.log("After");
		}
	};
</script>

<Card.Root class="mx-auto w-full max-w-md border-2 p-1 shadow-lg">
	<Card.Header class="space-y-3">
		<div class="flex flex-col items-center">
			<img src="/logo.png" alt="Logo" class="mb-2 h-12" />
		</div>
	</Card.Header>
	<Separator class="mt-2" />
	<div class="justify-ceter mt-4 flex w-full flex-col items-center space-y-2">
		<Card.Title class="text-2xl font-semibold">Welcome</Card.Title>
		<Card.Description class="text-center">Create a new account</Card.Description>
	</div>

	<Card.Content class="pt-5">
		<form
			action="?/register"
			method="POST"
			class="space-y-4"
			onsubmit={onRegisterFormSubmit}
			use:enhance={defaultFormEnhance}
			onformresult={onFormResult}
		>
			<input type="hidden" value={serializedPublicKey} name="public_key">
			<input type="hidden" value={serializedIdentityPublicKey} name="identity_public_key">
			<div class="space-y-2">
				<Label for="email" class="text-sm font-medium">Email</Label>
				<div class="relative">
					<Mail class="absolute left-3 top-2.5 size-5 text-muted-foreground" />
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="johndoe@example.com"
						class="pl-10"
						bind:value={email}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="username" class="text-sm font-medium">Username</Label>
				<div class="relative">
					<User class="absolute left-3 top-2.5 size-5 text-muted-foreground" />
					<Input
						id="username"
						name="username"
						type="username"
						placeholder="Johnny"
						class="pl-10"
						bind:value={username}
						oninput={() => (username = username.toLowerCase())}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="password" class="text-sm font-medium">Password</Label>
				</div>
				<div class="relative">
					<Lock class="absolute left-3 top-2.5 size-5 text-muted-foreground" />
					<Input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						class="pl-10"
						placeholder="••••••••••••••"
						bind:value={password}
					/>
					<button
						type="button"
						class="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{#if showPassword}
							<EyeOff class="size-5" />
						{:else}
							<Eye class="size-5" />
						{/if}
					</button>
					{#if password.length > 0}
						<div class="mt-2 space-y-1">
							<p class="mb-1 text-sm text-muted-foreground">Password requirements:</p>
							{#each constrains as constrain}
								<div class="flex items-center gap-2 text-sm">
									{#if constrain.isPassed()}
										<div class="text-lime-600">✓</div>
										<span class="text-lime-600">{constrain.error}</span>
									{:else}
										<div class="text-destructive">✗</div>
										<span class="text-destructive">{constrain.error}</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="repeatPassword" class="text-sm font-medium">Repeat Password</Label>
				</div>
				<div class="relative">
					<Lock class="absolute left-3 top-2.5 size-5 text-muted-foreground" />
					<Input
						id="repeatPassword"
						name="repeatPassword"
						type={showPassword ? 'text' : 'password'}
						class="pl-10"
						placeholder="••••••••••••••"
						bind:value={repeatPassword}
					/>
					<button
						type="button"
						class="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{#if showPassword}
							<EyeOff class="size-5" />
						{:else}
							<Eye class="size-5" />
						{/if}
					</button>
				</div>
			</div>

			{#if password && repeatPassword && password !== repeatPassword}
				<Alert.Root variant="destructive">
					<CircleAlert class="size-4" />
					<Alert.Title>Passwords must be equal.</Alert.Title>
				</Alert.Root>
			{/if}

			<Button type="submit" class="w-full gap-2" loading={isLoading} disabled={!isFormValid}>
				{#if isLoading}
					Registering...
				{:else}
					<KeyRound class="size-4" />
					Register
				{/if}
			</Button>
		</form>
	</Card.Content>

	<Card.Footer class="flex flex-col">
		<div class="text-center text-sm">
			Already have an account?
			<a href="/auth/login" class="font-medium text-primary hover:underline"> Log in </a>
		</div>
	</Card.Footer>
</Card.Root>
