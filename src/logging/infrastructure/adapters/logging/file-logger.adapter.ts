import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	LoggerPort,
	LogLevel,
} from '@logging/domain/ports/services/logger.port';
import type { ConsoleLoggerOptions } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

/**
 * File logger adapter that implements LoggerPort.
 * Writes logs to files with support for daily rotation.
 */
@Injectable()
export class FileLoggerAdapter implements LoggerPort {
	private readonly logDirectory: string;
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
		logFilePath?: string,
		private readonly options?: ConsoleLoggerOptions,
	) {
		const providedPath =
			logFilePath || path.join(process.cwd(), 'logs', 'app.log');
		if (providedPath.endsWith('.log')) {
			this.logDirectory = path.dirname(providedPath);
		} else {
			this.logDirectory = providedPath;
		}
		// Ensure directory exists
		if (!fs.existsSync(this.logDirectory)) {
			fs.mkdirSync(this.logDirectory, { recursive: true });
		}
		// Initialize log levels and context from options
		if (options?.logLevels) {
			this.enabledLogLevels = options.logLevels;
		}
		if (options?.context) {
			this.context = options.context;
		}
	}

	/**
	 * Write a log entry to file with proper formatting.
	 */
	private writeToFile(level: LogLevel, message: unknown, stack?: string): void {
		if (!this.isLevelEnabled(level)) {
			return;
		}

		const timestamp = new Date();
		const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
		const logFilePath = path.join(this.logDirectory, `${dateStr}.log`);

		// Format date as MM/DD/YYYY
		const month = String(timestamp.getMonth() + 1).padStart(2, '0');
		const day = String(timestamp.getDate()).padStart(2, '0');
		const year = timestamp.getFullYear();
		const dateFormatted = `${month}/${day}/${year}`;

		// Format time as HH:MM:SS AM/PM
		const timeStr = timestamp.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true,
		});

		const pid = process.pid;
		const levelUpper = level.toUpperCase();
		const contextStr = this.context ? `[${this.context}] ` : '';
		const messageStr = this.stringifyMessage(message);
		const stackStr = stack ? ` ${stack}` : '';
		const logEntry = `[Nest] ${pid}  - ${dateFormatted}, ${timeStr}     ${levelUpper} ${contextStr}${messageStr}${stackStr}\n`;

		try {
			fs.appendFileSync(logFilePath, logEntry);
		} catch (error) {
			console.error('Failed to write to log file:', error);
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
	 * Extract stack and message from optional params.
	 */
	private extractStackFromOptionalParams(optionalParams: unknown[]): {
		stack?: string;
		context?: string;
	} {
		const stack = optionalParams.find((param) => typeof param === 'string');
		const context = optionalParams
			.filter((param) => typeof param === 'string')
			.slice(1)[0];
		return {
			stack: stack as string | undefined,
			context: context as string | undefined,
		};
	}

	/**
	 * Write a 'log' level log.
	 */
	log(message: unknown, ...optionalParams: unknown[]): void {
		const { stack } = this.extractStackFromOptionalParams(optionalParams);
		this.writeToFile('log', message, stack);
	}

	/**
	 * Write an 'error' level log.
	 */
	error(message: unknown, ...optionalParams: unknown[]): void {
		const { stack } = this.extractStackFromOptionalParams(optionalParams);
		this.writeToFile('error', message, stack);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: unknown, ...optionalParams: unknown[]): void {
		const { stack } = this.extractStackFromOptionalParams(optionalParams);
		this.writeToFile('warn', message, stack);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug(message: unknown, ...optionalParams: unknown[]): void {
		const { stack } = this.extractStackFromOptionalParams(optionalParams);
		this.writeToFile('debug', message, stack);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	verbose(message: unknown, ...optionalParams: unknown[]): void {
		const { stack } = this.extractStackFromOptionalParams(optionalParams);
		this.writeToFile('verbose', message, stack);
	}

	/**
	 * Write a 'fatal' level log.
	 */
	fatal(message: unknown, ...optionalParams: unknown[]): void {
		const { stack } = this.extractStackFromOptionalParams(optionalParams);
		this.writeToFile('fatal', message, stack);
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
