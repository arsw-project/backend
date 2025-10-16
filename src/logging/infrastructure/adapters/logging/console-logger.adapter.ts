import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class ConsoleLoggerAdapter extends ConsoleLogger implements LoggerPort {
	// Handle both NestJS and LoggerPort signatures
	log(
		messageOrLevel: string | unknown,
		contextOrMessage?: string | unknown,
		maybeContext?: string,
		maybeStack?: string,
	): void {
		// Check if this is being called with LoggerPort signature
		// LoggerPort: log(level: string, message: string, context?: string, stack?: string)
		// NestJS: log(message: any, context?: string)
		if (
			typeof messageOrLevel === 'string' &&
			typeof contextOrMessage === 'string' &&
			maybeContext !== undefined
		) {
			// LoggerPort signature: log(level, message, context?, stack?)
			const level = messageOrLevel;
			const message = contextOrMessage;
			const context = maybeContext;
			const stack = maybeStack;

			// Map to NestJS ConsoleLogger methods based on level
			switch (level.toLowerCase()) {
				case 'error':
					super.error(message, stack, context);
					break;
				case 'warn':
					super.warn(message, context);
					break;
				case 'debug':
					super.debug(message, context);
					break;
				case 'verbose':
					super.verbose(message, context);
					break;
				case 'fatal':
					super.fatal(message, context);
					break;
				default:
					super.log(message, context);
					break;
			}
		} else {
			// NestJS signature: log(message, context?)
			super.log(messageOrLevel, contextOrMessage as string | undefined);
		}
	}
}
