export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
	authProvider: string;
	providerId: string | null;
	createdAt: Date;
	updatedAt: Date;
}
