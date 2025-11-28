import { Global, Module } from '@nestjs/common';
import { DrizzleConnection } from './drizzle.connection';

@Global()
@Module({
	providers: [DrizzleConnection],
	exports: [DrizzleConnection],
})
export class DrizzleModule {}
