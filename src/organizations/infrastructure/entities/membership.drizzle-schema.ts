import { usersTable } from '@users/infrastructure/entities/user.drizzle-schema';
import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { organizationsTable } from './organization.drizzle-schema';

export const membershipRoleEnum = pgEnum('membership_role', [
	'owner',
	'admin',
	'member',
	'viewer',
]);

export const membershipsTable = pgTable(
	'memberships',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		organizationId: uuid('organization_id')
			.notNull()
			.references(() => organizationsTable.id, { onDelete: 'cascade' }),
		role: membershipRoleEnum('role').default('member').notNull(),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		unique('unique_user_organization').on(table.userId, table.organizationId),
	],
);

export const membershipsRelations = relations(membershipsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [membershipsTable.userId],
		references: [usersTable.id],
	}),
	organization: one(organizationsTable, {
		fields: [membershipsTable.organizationId],
		references: [organizationsTable.id],
	}),
}));
