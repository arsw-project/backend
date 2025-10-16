import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExternalLoggerAdapter implements LoggerPort {
	private readonly endpointUrl: string;

	constructor(endpointUrl: string) {
		this.endpointUrl = endpointUrl;
	}

	private async sendLog(
		level: string,
		message: string,
		context?: string,
		stack?: string,
	): Promise<void> {
		try {
			await axios.post(this.endpointUrl, {
				timestamp: new Date().toISOString(),
				level,
				message,
				context,
				stack,
			});
		} catch (error) {
			console.error('Failed to send log to external service:', error);
		}
	}

	async log(
		level: string,
		message: string,
		context?: string,
		stack?: string,
	): Promise<void> {
		await this.sendLog(level, message, context, stack);
	}

	async error(
		message: unknown,
		stack?: string,
		context?: string,
	): Promise<void> {
		await this.sendLog('error', String(message), context, stack);
	}

	async warn(message: string, context?: string): Promise<void> {
		await this.sendLog('warn', message, context);
	}

	async debug(message: string, context?: string): Promise<void> {
		await this.sendLog('debug', message, context);
	}

	async verbose(message: string, context?: string): Promise<void> {
		await this.sendLog('verbose', message, context);
	}

	async fatal(message: string, context?: string): Promise<void> {
		await this.sendLog('fatal', message, context);
	}
}
