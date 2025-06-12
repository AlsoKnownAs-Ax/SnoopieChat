import type { Message } from '$lib/types/message';

export interface MessagesByChat {
	[chatId: string]: Message[];
}

export let MOCK_MESSAGES: MessagesByChat = {
	'1': [
		{
			id: 1,
			content: "Hey there! How's your day going?",
			timestamp: '10:30 AM',
			isSelf: false
		},
		{
			id: 2,
			content: "Hi Sarah! It's going well, thanks for asking. Just finishing up some work.",
			timestamp: '10:32 AM',
			isSelf: true
		},
		{
			id: 3,
			content: "That's great! Are we still meeting for coffee later today?",
			timestamp: '10:33 AM',
			isSelf: false
		},
		{
			id: 4,
			content: 'Yes, definitely! How about 3 PM at the usual place?',
			timestamp: '10:35 AM',
			isSelf: true
		},
		{
			id: 5,
			content: "Perfect! I'll see you then. I have some exciting news to share!",
			timestamp: '10:36 AM',
			isSelf: false
		},
		{
			id: 6,
			content: "Now I'm curious! Looking forward to hearing it.",
			timestamp: '10:38 AM',
			isSelf: true
		},
		{
			id: 7,
			content: "It's a surprise! You'll have to wait until we meet 😊",
			timestamp: '10:40 AM',
			isSelf: false
		}
	],
	'2': [
		{
			id: 1,
			content: 'Hi Mike, did you get the project files I sent?',
			timestamp: '09:15 AM',
			isSelf: true
		},
		{
			id: 2,
			content: 'Yes, just looking at them now. The designs look great!',
			timestamp: '09:20 AM',
			isSelf: false
		},
		{
			id: 3,
			content: 'Thanks! Let me know if you have any questions.',
			timestamp: '09:22 AM',
			isSelf: true
		}
	],
	'3': [
		{
			id: 1,
			content: 'Are we still on for dinner tonight?',
			timestamp: '12:05 PM',
			isSelf: false
		},
		{
			id: 2,
			content: 'Absolutely! I made reservations for 7pm.',
			timestamp: '12:10 PM',
			isSelf: true
		},
		{
			id: 3,
			content: 'Perfect, see you then!',
			timestamp: '12:12 PM',
			isSelf: false
		}
	],
	'4': [
		{
			id: 1,
			content: 'Hey team, the client loved our presentation!',
			timestamp: '11:30 AM',
			isSelf: false
		},
		{
			id: 2,
			content: "That's fantastic news!",
			timestamp: '11:32 AM',
			isSelf: true
		},
		{
			id: 3,
			content: "Let's celebrate after work tomorrow.",
			timestamp: '11:35 AM',
			isSelf: false
		},
		{
			id: 4,
			content: 'Count me in!',
			timestamp: '11:36 AM',
			isSelf: true
		}
	]
};

export function getMessagesForChat(chatId: string | undefined): Message[] {
	if (chatId === undefined) return [];
	return MOCK_MESSAGES[chatId] || [];
}

// Helper function to add a new message to a chat
export function addMessageToChat(chatId: string, message: Omit<Message, 'id'>): void {
	if (!MOCK_MESSAGES[chatId]) {
		MOCK_MESSAGES[chatId] = [];
	}

	const newId =
		MOCK_MESSAGES[chatId].length > 0 ? Math.max(...MOCK_MESSAGES[chatId].map((m) => m.id)) + 1 : 1;

	MOCK_MESSAGES[chatId].push({
		...message,
		id: newId
	});
}
