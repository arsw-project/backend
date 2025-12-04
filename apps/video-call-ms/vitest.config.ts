import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		root: './src',
		include: ['**/*.spec.ts', '**/*.test.ts'],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.{idea,git,cache,output,temp}/**',
		],
		coverage: {
			provider: 'v8',
		},
	},
	resolve: {
		alias: {
			'@rooms': resolve(__dirname, './src/rooms'),
			'@common': resolve(__dirname, './src/common'),
			'@auth': resolve(__dirname, './src/auth'),
			'@chat': resolve(__dirname, './src/chat'),
		},
	},
});
