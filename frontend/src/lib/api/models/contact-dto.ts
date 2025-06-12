

/**
 * 
 * @export
 * @interface ContactDTO
 */
export interface ContactDTO {
    /**
     * 
     * @type {number}
     * @memberof ContactDTO
     */
    'id': number;
    /**
     * 
     * @type {string}
     * @memberof ContactDTO
     */
    'username': string;
    /**
     * 
     * @type {string}
     * @memberof ContactDTO
     */
    'email': string;
    /**
     * 
     * @type {boolean}
     * @memberof ContactDTO
     */
    'blocked': boolean;
    /**
     * 
     * @type {string}
     * @memberof ContactDTO
     */
    'lastMessage'?: string;
    /**
     * 
     * @type {string}
     * @memberof ContactDTO
     */
    'messageTimestamp'?: string;
    /**
     * 
     * @type {boolean}
     * @memberof ContactDTO
     */
    'online'?: boolean;
}

