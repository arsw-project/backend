import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

@Injectable()
export class DrizzleConnection implements OnModuleDestroy {
	public readonly database: PostgresJsDatabase;
	private readonly client: postgres.Sql;

	constructor() {
		if (!process.env.DRIZZLE_DATABASE_URL) {
			throw new Error('DRIZZLE_DATABASE_URL is not defined');
		}

		this.client = postgres(process.env.DRIZZLE_DATABASE_URL);
		this.database = drizzle(this.client);
	}

	async onModuleDestroy() {
		await this.client.end();
	}
}
