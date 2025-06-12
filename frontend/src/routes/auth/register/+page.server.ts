import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { registrationSchema } from '$lib/schemas/auth/schemas';
import { UserService } from '$lib/core/api-services';
import type { Users } from '$lib/api';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	register: async ({ request }) => {
		const form = Object.fromEntries(await request.formData());

		const result = registrationSchema.safeParse(form);

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return fail(400, { errors });
		}

		const resultData = result.data;
		const userData: Users = {
			username: resultData.username,
			email: resultData.email,
			password: resultData.password
		};

		try {
			const { data } = await UserService.register({
				userData: userData,
				publicKey: resultData.public_key,
				identityPublicKey: resultData.identity_public_key
			});
		} catch (error: any) {
			return fail(400, { error: error.message });
		}

		return {
			redirect: 'login',
			success: true,
			message: 'Registration succesfully'
		};
	}
};
