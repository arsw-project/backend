import type {Difficulty, TicketStatus} from '@tickets/domain/entities/ticket.entity';
import {date, pgTable, text, uuid, jsonb} from 'drizzle-orm/pg-core';

export const ticketsTable = pgTable('tickets', {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    acceptanceCriteria: jsonb('acceptance_criteria')
        .notNull()
        .$type<string[]>(),
    status: text('status').notNull().$type<TicketStatus>().default('Open'),
    assigneeId: uuid('assignee_id'),
    difficulty: text('difficulty').notNull().$type<Difficulty>(),
    tags: jsonb('tags')
        .notNull()
        .$type<string[]>(),
    createdBy: uuid('created_by').notNull(),
    createdAt: date('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: date('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
