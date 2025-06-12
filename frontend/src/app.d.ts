// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ContactDTO, UserClientDto } from '$lib/api';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: UserClientDto | undefined;
			contacts: ContactDTO[];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'svelte/elements' {
	export interface HTMLFormAttributes {
		onformresult?: FormEventHandler<T> | undefined | null;
	}
}

export {};
