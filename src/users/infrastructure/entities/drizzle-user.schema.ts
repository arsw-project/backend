import type { AuthProvider } from '@users/domain/entities/user.entity';
import { date, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	authProvider: text('auth_provider').notNull().$type<AuthProvider>(),
	providerId: text('provider_id'),
	createdAt: date('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: date('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
