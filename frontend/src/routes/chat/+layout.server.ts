import { ContactService } from '$lib/core/api-services';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	try {
		const [contactsResponse, requestsCountResponse] = await Promise.all([
			ContactService.getContacts(),
			ContactService.getPendingFriendRequestsCount()
		]);

		locals.contacts = contactsResponse.data;

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		return {
			user: locals.user,
			contacts: locals.contacts,
			requestsCount: requestsCountResponse.data
		};
	} catch (err: any) {
		throw error(500, `Failed to load contacts: ${err.message}`);
	}
}) satisfies LayoutServerLoad;
