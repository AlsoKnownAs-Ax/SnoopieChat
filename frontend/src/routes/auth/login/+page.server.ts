import { HealthService, UserService } from '$lib/core/api-services';
import { loginSchema } from '$lib/schemas/auth/schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { dev } from '$app/environment';

export const load = (async () => {
	const [backendData, PkiData] = await Promise.all([
		HealthService.pingHealth(),
		HealthService.pkiStatus()
	]);
	console.log('backend ping: ', backendData.data);
	console.log('Pki ping: ', PkiData.data);
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		// Alex: This will contain the api request and frontend validation using zod
		const formData = Object.fromEntries(await request.formData());
		const result = loginSchema.safeParse(formData);

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			console.log('errors: ', errors);

			return fail(400, { errors });
		}

		try {
			const { data } = await UserService.login(result.data);

			cookies.set('token', data, {
				path: '/',
				secure: !dev,
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			return {
				redirect: '/chat',
				success: true,
				message: 'Login succesfully'
			};
		} catch (error: any) {
			console.log('Full error: ', JSON.stringify(error.originalError));
			console.log('Error message: ', error.message);
			console.log('Error message: ', error.details);

			return fail(error.status, { error: error.message });
		}
	}
};
