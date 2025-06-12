

/**
 * 
 * @export
 * @interface ChatMessage
 */
export interface ChatMessage {
    /**
     * 
     * @type {number}
     * @memberof ChatMessage
     */
    'id'?: number;
    /**
     * 
     * @type {string}
     * @memberof ChatMessage
     */
    'chatId'?: string;
    /**
     * 
     * @type {number}
     * @memberof ChatMessage
     */
    'senderId'?: number;
    /**
     * 
     * @type {number}
     * @memberof ChatMessage
     */
    'recipientId'?: number;
    /**
     * 
     * @type {string}
     * @memberof ChatMessage
     */
    'content'?: string;
    /**
     * 
     * @type {string}
     * @memberof ChatMessage
     */
    'timestamp'?: string;
    /**
     * 
     * @type {boolean}
     * @memberof ChatMessage
     */
    'isDummy'?: boolean;
}

