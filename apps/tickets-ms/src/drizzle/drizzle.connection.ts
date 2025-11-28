import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';

@Injectable()
export class DrizzleConnection {
	public readonly database: ReturnType<typeof drizzle>;

	constructor() {
		if (!process.env.TICKETS_DATABASE_URL) {
			throw new Error('TICKETS_DATABASE_URL is not defined');
		}

		this.database = drizzle(process.env.TICKETS_DATABASE_URL);
	}
}
