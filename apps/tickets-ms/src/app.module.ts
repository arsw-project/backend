import { AuthModule } from '@auth/auth.module';
import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { TicketsModule } from '@tickets/module/tickets.module';
import { HealthModule } from './health/module/health.module';

@Module({
	imports: [DrizzleModule, AuthModule, TicketsModule, HealthModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
