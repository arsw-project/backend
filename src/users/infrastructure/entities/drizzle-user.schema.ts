import { date, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	authProvider: text('auth_provider').notNull(),
	providerId: text('provider_id'),
	createdAt: date('created_at').defaultNow().notNull(),
	updatedAt: date('updated_at').defaultNow().notNull(),
});
