import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { CompositeLoggerAdapter } from '@logging/infrastructure/adapters/logging/composite-logger.adapter';
import { ConsoleLoggerAdapter } from '@logging/infrastructure/adapters/logging/console-logger.adapter';
import { ExternalLoggerAdapter } from '@logging/infrastructure/adapters/logging/external-logger.adapter';
import { FileLoggerAdapter } from '@logging/infrastructure/adapters/logging/file-logger.adapter';
import { Module } from '@nestjs/common';
import { SettingsClient } from '@settings/infrastructure/clients/settings.client';
import { SettingsModule } from '@settings/module/settings.module';

@Module({
	imports: [SettingsModule],
	providers: [
		{
			provide: LoggerPort,
			useFactory: (settings: SettingsClient): LoggerPort => {
				const adapters: LoggerPort[] = [];

				if (settings.loggingConsoleEnabled) {
					adapters.push(new ConsoleLoggerAdapter());
				}

				if (settings.loggingFileEnabled) {
					adapters.push(new FileLoggerAdapter(settings.loggingFilePath));
				}

				if (settings.loggingExternalEnabled && settings.loggingExternalUrl) {
					adapters.push(new ExternalLoggerAdapter(settings.loggingExternalUrl));
				}

				return new CompositeLoggerAdapter(adapters);
			},
			inject: [SettingsClient],
		},
	],
	exports: [LoggerPort],
})
export class LoggingModule {}
