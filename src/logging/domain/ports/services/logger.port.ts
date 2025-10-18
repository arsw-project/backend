export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';

export abstract class LoggerPort {
	abstract log(message: unknown, ...optionalParams: unknown[]): void;

	abstract error(message: unknown, ...optionalParams: unknown[]): void;

	abstract warn(message: unknown, ...optionalParams: unknown[]): void;

	abstract debug(message: unknown, ...optionalParams: unknown[]): void;

	abstract verbose(message: unknown, ...optionalParams: unknown[]): void;

	abstract fatal(message: unknown, ...optionalParams: unknown[]): void;

	abstract setLogLevels(levels: LogLevel[]): void;

	abstract setContext(context: string): void;

	abstract resetContext(): void;

	abstract isLevelEnabled(level: LogLevel): boolean;
}
