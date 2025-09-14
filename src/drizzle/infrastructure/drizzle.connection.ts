import { Injectable } from '@nestjs/common';
import { date, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';

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

@Injectable()
export class DrizzleConnection {
	public readonly database: ReturnType<typeof drizzle>;

	constructor() {
		if (!process.env.DRIZZLE_DATABASE_URL) {
			throw new Error('DRIZZLE_DATABASE_URL is not defined');
		}

		this.database = drizzle(process.env.DRIZZLE_DATABASE_URL);
	}
}
