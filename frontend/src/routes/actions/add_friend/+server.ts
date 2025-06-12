import { ContactService } from '$lib/core/api-services';
import type { RequestHandler, RequestEvent } from './$types';
import { json } from "@sveltejs/kit"

export const POST = (async ({ request, locals }: RequestEvent) => {
    const formData = await request.formData();
	const username = formData.get('username')?.toString();
    console.log('Adding friend:', username);

    if(!username){
        return json({error: "username cannot be null"})
    }

    try {
        const { data } = await ContactService.addContact({
					username: username
				});

				return json({ message: data });
    } catch (error: any) {
        return json({error: error.message})
    }

}) satisfies RequestHandler;