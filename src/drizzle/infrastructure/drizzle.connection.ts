import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';

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
