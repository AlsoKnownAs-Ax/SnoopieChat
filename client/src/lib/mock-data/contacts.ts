import type { Contact } from '$lib/types/contact';

export const MOCK_CONTACTS: Contact[] = [
	{
		id: 1,
		name: 'John Doe',
		avatar: '/avatar_placeholder.png',
		lastMessage: 'Join our secret organisation',
		time: '10:30 AM',
		unread: 5,
		online: true
	},
	{
		id: 2,
		name: 'Anonymous',
		avatar: '/avatar_placeholder.png',
		lastMessage: "Let's talk on on snoopiChat my friend",
		time: 'Yesterday',
		unread: 2,
		online: false
	},
	{
		id: 3,
		name: 'Secret Guy 98',
		avatar: '/avatar_placeholder.png',
		lastMessage: 'The most secure chat',
		time: 'Monday',
		unread: 8,
		online: true
	}
];
