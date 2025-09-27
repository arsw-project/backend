import { date, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const organizationsTable = pgTable('organizations', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description').notNull(),
	createdAt: date('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: date('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
