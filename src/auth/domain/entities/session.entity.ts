export interface Session {
	id: string;
	secretHash: Uint8Array;
	createdAt: Date;
}

export interface SessionWithToken extends Session {
	token: string;
}
