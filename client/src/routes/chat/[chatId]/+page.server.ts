import { MOCK_CONTACTS } from '$lib/mock-data/contacts';
import { getMessagesForChat } from '$lib/mock-data/messages';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const id = params.chatId ? parseInt(params.chatId) : undefined;

	const getContactData = (id: number | undefined) => {
		if (id === undefined) return null;
		return MOCK_CONTACTS.find((contact) => contact.id === id) || null;
	};

	console.log('contact:', getContactData(id));
	console.log('messages:', getMessagesForChat(params.chatId));

	return {
		contactData: getContactData(id),
		messages: getMessagesForChat(params.chatId)
	};
}) satisfies PageServerLoad;
