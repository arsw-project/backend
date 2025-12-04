import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.TICKETS_DATABASE_URL) {
	throw new Error('TICKETS_DATABASE_URL is not defined');
}

export default defineConfig({
	out: './drizzle-out',
	schema: ['./src/**/*.drizzle-schema.ts'],
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.TICKETS_DATABASE_URL,
	},
});
