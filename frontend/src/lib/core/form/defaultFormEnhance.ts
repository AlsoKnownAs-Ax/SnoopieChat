import { goto } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

export const defaultFormEnhance: SubmitFunction = ({ formElement }) => {
	return async ({ result }) => {
		if (result.type === 'failure') {
			const error = result.data?.error;
			if (error) toast.error(error);
		} else if (result.type === 'success') {
			const { message, redirect } = result.data || {};
			if (message) toast.success(message);
			if (redirect) await goto(redirect);
		}
		const event = new CustomEvent('formresult', {
			detail: {
				result,
				isComplete: true
			}
		});
		formElement.dispatchEvent(event);
	};
};
