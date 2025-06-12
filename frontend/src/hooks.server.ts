import { redirect, type Handle } from '@sveltejs/kit';
import '$lib/core/sdk-setup';
import { apiAxiosInstance } from '$lib/core/sdk-setup';
import { UserService } from '$lib/core/api-services';

const openPaths = ['/auth', '/api'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('token');
	const pathname = event.url.pathname;

	// Skip any checks if is a open path
	if (openPaths.some((openPath) => pathname.startsWith(openPath))) {
		return resolve(event);
	}

	if (token) {
		apiAxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete apiAxiosInstance.defaults.headers.common['Authorization'];
	}

	try {
		const { data } = await UserService.verifyToken();
		event.locals.user = data;
		console.log('verifyToken: ', data);
	} catch (error: any) {
		console.log('error: ', error.message);
		event.locals.user = undefined;
		event.cookies.delete('token', { path: '/' });
		delete apiAxiosInstance.defaults.headers.common['Authorization'];
		throw redirect(303, '/auth/login');
	}

	const response = await resolve(event);
	return response;
};
