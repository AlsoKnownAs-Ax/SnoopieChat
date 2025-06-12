import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { applyPadding, removePadding } from './padme';

const WEBSOCKET_URL = 'http://localhost:8080/ws-chat';

export class WebSocketService {
	private client: Client | null = null;
	private messageQueue: { destination: string; body: any }[] = [];
	private isConnected = false;
	private userId: number | undefined = undefined;

	constructor(userId: number) {
		this.userId = userId;
	}

	async connect(onMessage: (message: any) => void): Promise<void> {
		if (typeof window === 'undefined') {
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			this.client = new Client({
				webSocketFactory: () => {
					return new SockJS(WEBSOCKET_URL);
				},
				connectHeaders: {},
				reconnectDelay: 10000,
				heartbeatIncoming: 25000,
				heartbeatOutgoing: 25000,
				debug: (str: string) => console.log(str)
			});

			this.client.onConnect = () => {
				console.log('WebSocket connected successfully');
				this.isConnected = true;

				if (!this.client) {
					console.error('Client was not initialized...');
					return;
				}

				this.client.onWebSocketError = (error: any) => {
					console.error('WebSocket error:', error);
					this.isConnected = false;
					setTimeout(() => {
						if (this.client) {
							console.log('Attempting to reconnect...');
							this.client.activate();
						}
					}, 5000);
				};

				this.client.subscribe(`/user/${this.userId}/queue/messages`, (message: any) => {
					console.log('RECEIVED MESSAGE:', message.body);
					try {
						const parsed = JSON.parse(message.body);
						
						// Check if this is a dummy message - if so, ignore it for UI purposes
						if (parsed.isDummy === true) {
							console.log('Received dummy message - ignoring for UI:', parsed);
							return; // Don't process dummy messages in the UI
						}
						
						const byteArray = Uint8Array.from(atob(parsed.content), c => c.charCodeAt(0));
						//decryption before unpadding

						const unpadded = removePadding(byteArray);
						const json = new TextDecoder().decode(unpadded);
						const parsedContent = JSON.parse(json);

						const parsedMessage = {
							...parsed,
							content : parsedContent
						};

						console.log('PARSED MESSAGE:', parsedMessage);
						onMessage(parsedMessage);
					} catch (e) {
						console.error('Error parsing message:', e);
					}
				});

				// Process any queued messages
				while (this.messageQueue.length > 0) {
					const { destination, body } = this.messageQueue.shift()!;
					this.sendMessage(destination, body);
				}

				resolve();
			};

			this.client.onStompError = (frame: any) => {
				console.error('STOMP error:', frame);
				reject(new Error(`STOMP error: ${frame.headers['message']}`));
			};

			this.client.onWebSocketClose = (event: any) => {
				console.error('WebSocket closed:', event);
				this.isConnected = false;
			};

			this.client.onDisconnect = () => {
				console.log('STOMP client disconnected');
				this.isConnected = false;
			};

			setInterval(() => {
				if (this.client && !this.isConnected && this.client.active) {
					console.log('Connection state mismatch detected, resetting state');
					this.isConnected = true;
				} else if (this.client && this.isConnected && !this.client.active) {
					console.log('Connection appears broken, reconnecting...');
					this.client.activate();
				}
			}, 30000);

			console.log('Activating WebSocket...');
			this.client.activate();
		});
	}

	sendMessage(destination: string, body: any) {
		if (!this.client) {
			console.error('WebSocket client is null');
			return;
		}

		if (!this.isConnected) {
			console.log('WebSocket not connected, queueing message:', body);
			this.messageQueue.push({ destination, body });
			return;
		}


		const plain = new TextEncoder().encode(JSON.stringify(body.content));
		const padded = applyPadding(plain);
		const b64 = btoa(String.fromCharCode(...padded));

		//encryption goes after padding

		const messageToSend = {
			...body,
			content: b64,
			isDummy: false // Ensure real user messages are marked as not dummy
		};

		console.log('SENDING MESSAGE to', destination, ':', messageToSend);
		this.client.publish({
			destination,
			body: JSON.stringify(messageToSend)
		});
	}

	disconnect() {
		console.log('Disconnecting WebSocket...');
		if (this.client?.active) {
			this.client.deactivate();
		}
		this.isConnected = false;
	}
}