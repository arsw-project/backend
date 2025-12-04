import { Module } from '@nestjs/common';
import { HealthController } from '../infrastructure/http/health-rest.controller';

@Module({
	controllers: [HealthController],
})
export class HealthModule {}
