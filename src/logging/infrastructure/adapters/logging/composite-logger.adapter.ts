import {
	LoggerPort,
	LogLevel,
} from '@logging/domain/ports/services/logger.port';
import { Injectable } from '@nestjs/common';

/**
 * Composite logger adapter that delegates to multiple logger adapters.
 * Allows logging to multiple destinations simultaneously.
 */
@Injectable()
export class CompositeLoggerAdapter implements LoggerPort {
	constructor(private readonly adapters: LoggerPort[]) {}

	/**
	 * Write a 'log' level log to all adapters.
	 */
	log(message: unknown, ...optionalParams: unknown[]): void {
		this.adapters.forEach((adapter) => {
			adapter.log(message, ...optionalParams);
		});
	}

	/**
	 * Write an 'error' level log to all adapters.
	 */
	error(message: unknown, ...optionalParams: unknown[]): void {
		this.adapters.forEach((adapter) => {
			adapter.error(message, ...optionalParams);
		});
	}

	/**
	 * Write a 'warn' level log to all adapters.
	 */
	warn(message: unknown, ...optionalParams: unknown[]): void {
		this.adapters.forEach((adapter) => {
			adapter.warn(message, ...optionalParams);
		});
	}

	/**
	 * Write a 'debug' level log to all adapters.
	 */
	debug(message: unknown, ...optionalParams: unknown[]): void {
		this.adapters.forEach((adapter) => {
			adapter.debug(message, ...optionalParams);
		});
	}

	/**
	 * Write a 'verbose' level log to all adapters.
	 */
	verbose(message: unknown, ...optionalParams: unknown[]): void {
		this.adapters.forEach((adapter) => {
			adapter.verbose(message, ...optionalParams);
		});
	}

	/**
	 * Write a 'fatal' level log to all adapters.
	 */
	fatal(message: unknown, ...optionalParams: unknown[]): void {
		this.adapters.forEach((adapter) => {
			adapter.fatal(message, ...optionalParams);
		});
	}

	/**
	 * Set log levels for all adapters.
	 */
	setLogLevels(levels: LogLevel[]): void {
		this.adapters.forEach((adapter) => {
			adapter.setLogLevels(levels);
		});
	}

	/**
	 * Set context for all adapters.
	 */
	setContext(context: string): void {
		this.adapters.forEach((adapter) => {
			adapter.setContext(context);
		});
	}

	/**
	 * Reset context for all adapters.
	 */
	resetContext(): void {
		this.adapters.forEach((adapter) => {
			adapter.resetContext();
		});
	}

	/**
	 * Check if a specific log level is enabled.
	 * Returns true if at least one adapter has the level enabled.
	 */
	isLevelEnabled(level: LogLevel): boolean {
		return this.adapters.some((adapter) => adapter.isLevelEnabled(level));
	}
}
