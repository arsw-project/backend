import {
	LoggerPort,
	LogLevel,
} from '@logging/domain/ports/services/logger.port';
import type { ConsoleLoggerOptions } from '@nestjs/common';
import { ConsoleLogger, Injectable } from '@nestjs/common';

export interface ConsoleLoggerAdapterOptions extends ConsoleLoggerOptions {
	/**
	 * Enabled log levels.
	 */
	logLevels?: LogLevel[];
}

/**
 * Console logger adapter that extends NestJS ConsoleLogger and implements LoggerPort.
 * This adapter follows the NestJS logger interface natively.
 */
@Injectable()
export class ConsoleLoggerAdapter extends ConsoleLogger implements LoggerPort {
	constructor(context?: string, options?: ConsoleLoggerAdapterOptions) {
		super(context ?? '', options ?? {});
	}

	/**
	 * Write a 'log' level log.
	 * Prints to `stdout` with newline.
	 */
	log(message: unknown, ...optionalParams: unknown[]): void {
		super.log(message, ...optionalParams);
	}

	/**
	 * Write an 'error' level log.
	 * Prints to `stderr` with newline.
	 */
	error(message: unknown, ...optionalParams: unknown[]): void {
		super.error(message, ...optionalParams);
	}

	/**
	 * Write a 'warn' level log.
	 * Prints to `stdout` with newline.
	 */
	warn(message: unknown, ...optionalParams: unknown[]): void {
		super.warn(message, ...optionalParams);
	}

	/**
	 * Write a 'debug' level log.
	 * Prints to `stdout` with newline.
	 */
	debug(message: unknown, ...optionalParams: unknown[]): void {
		super.debug(message, ...optionalParams);
	}

	/**
	 * Write a 'verbose' level log.
	 * Prints to `stdout` with newline.
	 */
	verbose(message: unknown, ...optionalParams: unknown[]): void {
		super.verbose(message, ...optionalParams);
	}

	/**
	 * Write a 'fatal' level log.
	 * Prints to `stdout` with newline.
	 */
	fatal(message: unknown, ...optionalParams: unknown[]): void {
		super.fatal(message, ...optionalParams);
	}

	/**
	 * Set log levels
	 * @param levels log levels
	 */
	setLogLevels(levels: LogLevel[]): void {
		super.setLogLevels(levels);
	}

	/**
	 * Set logger context
	 * @param context context
	 */
	setContext(context: string): void {
		super.setContext(context);
	}

	/**
	 * Resets the logger context to the value that was passed in the constructor.
	 */
	resetContext(): void {
		super.resetContext();
	}

	/**
	 * Check if a specific log level is enabled
	 * @param level log level
	 */
	isLevelEnabled(level: LogLevel): boolean {
		return super.isLevelEnabled(level);
	}
}
