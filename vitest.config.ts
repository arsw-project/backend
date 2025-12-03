import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.{idea,git,cache,output,temp}/**',
			'apps/**',
		],
		coverage: {
			provider: 'v8',
			thresholds: {
				'**/*.case.ts': { 100: true },
			},
		},
	},
	resolve: {
		alias: {
			'@app': resolve(__dirname, './src/app'),
			'@health': resolve(__dirname, './src/health'),
			'@users': resolve(__dirname, './src/users'),
			'@auth': resolve(__dirname, './src/auth'),
			'@common': resolve(__dirname, './src/common'),
			'@drizzle': resolve(__dirname, './src/drizzle'),
			'@settings': resolve(__dirname, './src/settings'),
			'@logging': resolve(__dirname, './src/logging'),
			'@organizations': resolve(__dirname, './src/organizations'),
			'@internal': resolve(__dirname, './src/internal'),
		},
	},
});
