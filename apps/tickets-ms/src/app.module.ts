import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { TicketsModule } from '@tickets/module/tickets.module';

@Module({
	imports: [DrizzleModule, TicketsModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
