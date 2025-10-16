import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CompositeLoggerAdapter implements LoggerPort {
	private readonly adapters: LoggerPort[];

	constructor(adapters: LoggerPort[]) {
		this.adapters = adapters;
	}

	async log(
		level: string,
		message: string,
		context?: string,
		stack?: string,
	): Promise<void> {
		await Promise.all(
			this.adapters.map((adapter) =>
				adapter.log(level, message, context, stack),
			),
		);
	}

	async error(
		message: unknown,
		stack?: string,
		context?: string,
	): Promise<void> {
		await Promise.all(
			this.adapters.map((adapter) => adapter.error(message, stack, context)),
		);
	}

	async warn(message: string, context?: string): Promise<void> {
		await Promise.all(
			this.adapters.map((adapter) => adapter.warn(message, context)),
		);
	}

	async debug(message: string, context?: string): Promise<void> {
		await Promise.all(
			this.adapters.map((adapter) => adapter.debug(message, context)),
		);
	}

	async verbose(message: string, context?: string): Promise<void> {
		await Promise.all(
			this.adapters.map((adapter) => adapter.verbose(message, context)),
		);
	}

	async fatal(message: string, context?: string): Promise<void> {
		await Promise.all(
			this.adapters.map((adapter) => adapter.fatal(message, context)),
		);
	}
}
