import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const chatMessagesTable = pgTable('chat_messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	ticketId: uuid('ticket_id').notNull(),
	orgId: uuid('org_id').notNull(),
	userId: uuid('user_id').notNull(),
	userName: text('user_name').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type ChatMessageRecord = typeof chatMessagesTable.$inferSelect;
export type NewChatMessageRecord = typeof chatMessagesTable.$inferInsert;
