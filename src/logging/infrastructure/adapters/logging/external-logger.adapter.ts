import {
	LoggerPort,
	LogLevel,
} from '@logging/domain/ports/services/logger.port';
import type { ConsoleLoggerOptions } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

/**
 * External logger adapter that implements LoggerPort.
 * Sends logs to an external logging service via HTTP.
 */
@Injectable()
export class ExternalLoggerAdapter implements LoggerPort {
	private enabledLogLevels: LogLevel[] = [
		'log',
		'error',
		'warn',
		'debug',
		'verbose',
		'fatal',
	];
	private context?: string;

	constructor(
		private readonly endpointUrl: string,
		private readonly options?: ConsoleLoggerOptions,
	) {
		// Initialize log levels and context from options
		if (options?.logLevels) {
			this.enabledLogLevels = options.logLevels;
		}
		if (options?.context) {
			this.context = options.context;
		}
	}

	/**
	 * Send log to external service.
	 */
	private async sendLog(
		level: LogLevel,
		message: unknown,
		stack?: string,
	): Promise<void> {
		if (!this.isLevelEnabled(level)) {
			return;
		}

		try {
			const messageStr = this.stringifyMessage(message);
			await axios.post(this.endpointUrl, {
				timestamp: new Date().toISOString(),
				level,
				message: messageStr,
				context: this.context,
				stack,
				pid: process.pid,
			});
		} catch (error) {
			console.error('Failed to send log to external service:', error);
		}
	}

	/**
	 * Convert message to string for logging.
	 */
	private stringifyMessage(message: unknown): string {
		if (typeof message === 'string') {
			return message;
		}
		if (message instanceof Error) {
			return `${message.name}: ${message.message}`;
		}
		try {
			return JSON.stringify(message);
		} catch {
			return String(message);
		}
	}

	/**
	 * Extract stack from optional params.
	 */
	private extractStackFromOptionalParams(
		optionalParams: unknown[],
	): string | undefined {
		return optionalParams.find((param) => typeof param === 'string') as
			| string
			| undefined;
	}

	/**
	 * Write a 'log' level log.
	 */
	log(message: unknown, ...optionalParams: unknown[]): void {
		const stack = this.extractStackFromOptionalParams(optionalParams);
		void this.sendLog('log', message, stack);
	}

	/**
	 * Write an 'error' level log.
	 */
	error(message: unknown, ...optionalParams: unknown[]): void {
		const stack = this.extractStackFromOptionalParams(optionalParams);
		void this.sendLog('error', message, stack);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: unknown, ...optionalParams: unknown[]): void {
		const stack = this.extractStackFromOptionalParams(optionalParams);
		void this.sendLog('warn', message, stack);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug(message: unknown, ...optionalParams: unknown[]): void {
		const stack = this.extractStackFromOptionalParams(optionalParams);
		void this.sendLog('debug', message, stack);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	verbose(message: unknown, ...optionalParams: unknown[]): void {
		const stack = this.extractStackFromOptionalParams(optionalParams);
		void this.sendLog('verbose', message, stack);
	}

	/**
	 * Write a 'fatal' level log.
	 */
	fatal(message: unknown, ...optionalParams: unknown[]): void {
		const stack = this.extractStackFromOptionalParams(optionalParams);
		void this.sendLog('fatal', message, stack);
	}

	/**
	 * Set log levels
	 */
	setLogLevels(levels: LogLevel[]): void {
		this.enabledLogLevels = levels;
	}

	/**
	 * Set logger context
	 */
	setContext(context: string): void {
		this.context = context;
	}

	/**
	 * Reset logger context
	 */
	resetContext(): void {
		this.context = this.options?.context;
	}

	/**
	 * Check if a specific log level is enabled
	 */
	isLevelEnabled(level: LogLevel): boolean {
		return this.enabledLogLevels.includes(level);
	}
}
