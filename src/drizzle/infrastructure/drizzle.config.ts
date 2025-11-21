import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DRIZZLE_DATABASE_URL) {
	throw new Error('DRIZZLE_DATABASE_URL is not defined');
}

export default defineConfig({
	out: './drizzle-out',
	schema: ['./src/**/*.drizzle-schema.ts'],
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DRIZZLE_DATABASE_URL,
	},
});
