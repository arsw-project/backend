import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		root: './src',
		include: ['**/*.test.ts'],
	},
	resolve: {
		alias: {
			'@tickets': resolve(__dirname, './src/tickets'),
			'@common': resolve(__dirname, './src/common'),
			'@drizzle': resolve(__dirname, './src/drizzle'),
			'@auth': resolve(__dirname, './src/auth'),
		},
	},
});
