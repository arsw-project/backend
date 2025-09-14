import { HealthController } from '@health/infrastructure/http/health-rest.controller';
import { Module } from '@nestjs/common';

@Module({
	controllers: [HealthController],
})
export class HealthModule {}
