import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { HealthService } from '$lib/core/api-services';

export const load = (async () => {
	const [backendData, PkiData] = await Promise.all([
		HealthService.pingHealth(),
		HealthService.pkiStatus()
	]);
	console.log('backend ping: ', backendData.data);
	console.log('Pki ping: ', PkiData.data);

	throw redirect(308, '/auth/login');
}) satisfies PageServerLoad;
