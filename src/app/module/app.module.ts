import { RoleGuard } from '@auth/infrastructure/guards/role.guard';
import { SessionMiddleware } from '@auth/infrastructure/middleware/session.middleware';
import { AuthModule } from '@auth/module/auth.module';
import { DrizzleModule } from '@drizzle/module/drizzle.module';
import { HealthModule } from '@health/module/health.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SettingsModule } from '@settings/module/settings.module';
import { UsersModule } from '@users/module/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
		}),
		SettingsModule,
		DrizzleModule,
		HealthModule,
		UsersModule,
		AuthModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: RoleGuard,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(SessionMiddleware).forRoutes('*');
	}
}
