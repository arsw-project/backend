export type AuthProvider = 'local' | 'google';

export type UserRole = 'user' | 'admin' | 'system';

export interface User {
	id: string;
	name: string;
	email: string;
	password: string;
	authProvider: AuthProvider;
	providerId: string | null;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
}
