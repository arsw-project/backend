export abstract class LoggerPort {
	abstract log(
		level: string,
		message: string,
		context?: string,
		stack?: string,
	): void;

	abstract error(message: unknown, stack?: string, context?: string): void;

	abstract warn(message: string, context?: string): void;

	abstract verbose(message: string, context?: string): void;

	abstract debug(message: string, context?: string): void;

	abstract fatal(message: string, context?: string): void;
}
