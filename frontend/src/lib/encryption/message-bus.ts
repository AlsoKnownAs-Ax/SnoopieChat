import { writable, type Writable } from 'svelte/store';
import type { EncryptedMessage } from './types.js';

/**
 * Simple message bus to simulate message transfer between devices in demo
 */
class MessageBus {
	private messageQueue: Writable<EncryptedMessage[]> = writable([]);
	private subscribers: Map<string, (message: EncryptedMessage) => void> = new Map();

	/**
	 * Subscribe to messages for a specific user
	 */
	subscribe(userId: string, callback: (message: EncryptedMessage) => void) {
		this.subscribers.set(userId, callback);
		console.log(`${userId} subscribed to message bus`);
	}

	/**
	 * Unsubscribe a user from the message bus
	 */
	unsubscribe(userId: string) {
		this.subscribers.delete(userId);
		console.log(`${userId} unsubscribed from message bus`);
	}

	/**
	 * Send a message through the bus (simulates network transfer)
	 */
	async sendMessage(message: EncryptedMessage) {
		console.log(`Message bus: Routing message from ${message.senderId} to ${message.recipientId}`);
		console.log(`Message bus: Available subscribers:`, Array.from(this.subscribers.keys()));

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Deliver to recipient
		const recipientCallback = this.subscribers.get(message.recipientId);
		if (recipientCallback) {
			console.log(`Message bus: Delivering message to ${message.recipientId}`);
			try {
				await recipientCallback(message);
				console.log(`Message bus: Message delivered successfully to ${message.recipientId}`);
			} catch (error) {
				console.error(`Message bus: Failed to deliver message to ${message.recipientId}:`, error);
			}
		} else {
			console.log(`Message bus: No subscriber found for ${message.recipientId}`);
			console.log(`Message bus: Available subscribers:`, Array.from(this.subscribers.keys()));
		}
	}

	/**
	 * Get all queued messages (for debugging)
	 */
	getQueue() {
		return this.messageQueue;
	}
}

// Singleton instance for the demo
export const messageBus = new MessageBus();
