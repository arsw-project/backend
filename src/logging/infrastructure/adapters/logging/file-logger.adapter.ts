import * as fs from 'node:fs';
import * as path from 'node:path';
import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileLoggerAdapter implements LoggerPort {
	private readonly logFilePath: string;

	constructor(logFilePath?: string) {
		this.logFilePath =
			logFilePath || path.join(process.cwd(), 'logs', 'app.log');
		// Ensure directory exists
		const dir = path.dirname(this.logFilePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	}

	private writeToFile(
		level: string,
		message: string,
		context?: string,
		stack?: string,
	): void {
		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}${stack ? ` ${stack}` : ''}\n`;
		try {
			fs.appendFileSync(this.logFilePath, logEntry);
		} catch (error) {
			console.error('Failed to write to log file:', error);
		}
	}

	log(level: string, message: string, context?: string, stack?: string): void {
		this.writeToFile(level, message, context, stack);
	}

	error(message: unknown, stack?: string, context?: string): void {
		this.writeToFile('error', String(message), context, stack);
	}

	warn(message: string, context?: string): void {
		this.writeToFile('warn', message, context);
	}

	debug(message: string, context?: string): void {
		this.writeToFile('debug', message, context);
	}

	verbose(message: string, context?: string): void {
		this.writeToFile('verbose', message, context);
	}

	fatal(message: string, context?: string): void {
		this.writeToFile('fatal', message, context);
	}
}
