import type { AuthProvider } from '@users/domain/entities/user.entity';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin', 'system']);

export const usersTable = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	authProvider: text('auth_provider').notNull().$type<AuthProvider>(),
	providerId: text('provider_id'),
	role: roleEnum('role').default('user').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
