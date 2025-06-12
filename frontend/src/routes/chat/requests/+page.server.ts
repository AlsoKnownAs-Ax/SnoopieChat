import type { FirendRequestDTO } from '$lib/api';
import { ContactService } from '$lib/core/api-services';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	let requests: FirendRequestDTO[] = [];

	try {
		const { data } = await ContactService.getPendingFriendRequests();

		requests = data;
	} catch (err: any) {
		return error(err.status, { message: err.message });
	}

	return {
		requests
	};
}) satisfies PageServerLoad;

import type { Actions } from './$types';

export const actions: Actions = {
	async accept_request({ request }) {
		const formData = Object.fromEntries(await request.formData());
		const requestId = parseInt(formData['request_id'].toString());

		try {
			const { data: newContact } = await ContactService.acceptContact({
				id: requestId
			});

			console.log('new contact: ', newContact);
		} catch (error: any) {
			return fail(error.status, { error: error.message });
		}
	},
	async reject_request({ request }) {
		const formData = Object.fromEntries(await request.formData());
		const requestId = parseInt(formData['request_id'].toString());
		console.log('rejecting: ', requestId);
	}
};