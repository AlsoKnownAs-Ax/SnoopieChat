import type { ContactDTO } from '$lib/api';
import { ChatService, ContactService } from '$lib/core/api-services';
import { removePadding } from '$lib/core/padme';
import { MOCK_CONTACTS } from '$lib/mock-data/contacts';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	const contactId = params.chatId ? parseInt(params.chatId) : undefined;
	const userId = locals.user?.id;
	console.log('id: ', contactId);
	console.log('userId: ', userId);

	if (userId && contactId) {
		const [chatResponse, contactResponse] = await Promise.all([
			ChatService.findChatMessages(contactId, userId),
			ContactService.getContactData(contactId)
		]);
		console.log('received data: ', chatResponse.data);
		console.log('received Contact Data: ', contactResponse.data);

		//decrypt before unpadding
		const processedMessages = chatResponse.data.map((message: any) => {
			const byteArray = Uint8Array.from(atob(message.content), (c) => c.charCodeAt(0));
            const unpadded = removePadding(byteArray);
            const json = new TextDecoder().decode(unpadded);
            return {
                ...message,
                content: JSON.parse(json) // unpad
            };
		});

		return {
			contactData: contactResponse.data,
			messages: processedMessages
		};
	} else {
		const notFoundContact: ContactDTO = {
			id: -1,
			email: 'not@found.com',
			username: 'Not Found',
			lastMessage: 'Not Found',
			online: false,
			blocked: false
		};

		return {
			contactData: notFoundContact,
			messages: []
		};
	}
}) satisfies PageServerLoad;
