import { DrizzleModule } from '@drizzle/module/drizzle.module';
import { HealthModule } from '@health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '@users/module/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
		}),
		DrizzleModule,
		HealthModule,
		UsersModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
