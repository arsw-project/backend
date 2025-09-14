import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
	providers: [DrizzleConnection],
	exports: [DrizzleConnection],
})
export class DrizzleModule {}
