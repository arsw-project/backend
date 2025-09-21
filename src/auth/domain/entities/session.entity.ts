export interface Session {
	id: string;
	secretHash: Uint8Array;
	createdAt: Date;
}
