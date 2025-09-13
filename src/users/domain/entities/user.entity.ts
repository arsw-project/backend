export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
	providerId?: string;
	createdAt: Date;
	updatedAt: Date;
}
