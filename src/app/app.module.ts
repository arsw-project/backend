import { HealthModule } from '@health/health.module';
import { Module } from '@nestjs/common';
import { UsersModule } from '@users/module/users.module';

@Module({
	imports: [HealthModule, UsersModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
