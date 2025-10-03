import { Global, Module } from '@nestjs/common';
import { SettingsClient } from '@settings/infrastructure/clients/settings.client';

@Global()
@Module({
	providers: [SettingsClient],
	exports: [SettingsClient],
})
export class SettingsModule {}
