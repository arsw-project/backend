import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/**/infrastructure/entities/*.drizzle-schema.ts',
	out: './drizzle/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DRIZZLE_DATABASE_URL ?? '',
	},
});
