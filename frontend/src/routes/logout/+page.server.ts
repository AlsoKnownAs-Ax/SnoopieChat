import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({cookies}) => {
    cookies.delete('token', { path: '/' });

    throw redirect(303, '/auth/login')
}) satisfies PageServerLoad;