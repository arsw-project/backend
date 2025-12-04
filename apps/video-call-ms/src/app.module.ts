import { AuthModule } from '@auth/module/auth.module';
import { ChatModule } from '@chat/module/chat.module';
import { DrizzleModule } from '@drizzle/module/drizzle.module';
import { HealthModule } from '@health/module/health.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RoomsModule } from '@rooms/module/rooms.module';

@Module({
	imports: [
		HttpModule,
		DrizzleModule,
		HealthModule,
		AuthModule,
		ChatModule,
		RoomsModule,
	],
})
export class AppModule {}
