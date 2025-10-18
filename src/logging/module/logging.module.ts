import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { CompositeLoggerAdapter } from '@logging/infrastructure/adapters/logging/composite-logger.adapter';
import { ConsoleLoggerAdapter } from '@logging/infrastructure/adapters/logging/console-logger.adapter';
import { ExternalLoggerAdapter } from '@logging/infrastructure/adapters/logging/external-logger.adapter';
import { FileLoggerAdapter } from '@logging/infrastructure/adapters/logging/file-logger.adapter';
import { Global, Module } from '@nestjs/common';
import { SettingsClient } from '@settings/infrastructure/clients/settings.client';
import { SettingsModule } from '@settings/module/settings.module';

@Global()
@Module({
	imports: [SettingsModule],
	providers: [
		{
			provide: LoggerPort,
			useFactory: (settings: SettingsClient): LoggerPort => {
				const adapters: LoggerPort[] = [];

				if (settings.loggingConsoleEnabled) {
					adapters.push(
						new ConsoleLoggerAdapter('NestApp', {
							timestamp: true,
							colors: true,
						}),
					);
				}

				if (settings.loggingFileEnabled) {
					adapters.push(
						new FileLoggerAdapter(settings.loggingFilePath, {
							timestamp: false,
						}),
					);
				}

				if (settings.loggingExternalEnabled && settings.loggingExternalUrl) {
					adapters.push(
						new ExternalLoggerAdapter(settings.loggingExternalUrl, {
							timestamp: true,
						}),
					);
				}

				if (adapters.length === 0) {
					adapters.push(
						new ConsoleLoggerAdapter('NestApp', {
							timestamp: true,
							colors: true,
						}),
					);
				}

				if (adapters.length === 1) {
					return adapters[0];
				}

				return new CompositeLoggerAdapter(adapters);
			},
			inject: [SettingsClient],
		},
		// Also provide ConsoleLoggerAdapter as a standalone provider for direct injection
		ConsoleLoggerAdapter,
	],
	exports: [LoggerPort, ConsoleLoggerAdapter],
})
export class LoggingModule {}
