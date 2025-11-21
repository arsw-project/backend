export type AuthProvider = 'local' | 'google';

export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
	authProvider: AuthProvider;
	providerId: string | null;
	createdAt: Date;
	updatedAt: Date;
}
