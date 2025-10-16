import { Injectable } from '@nestjs/common';

/**
 * Abstract class representing settings options for the application client.
 *
 * @property drizzleDatabaseUrl - The URL for the Drizzle database connection.
 * @property googleClientId - The client ID for Google authentication.
 * @property googleClientSecret - The client secret for Google authentication.
 * @property googleLoginRedirect - The redirect URI used after Google login.
 * @property sessionExpiresInSeconds - The duration (in seconds) for which a session remains valid.
 * @property host - The host address for the application.
 * @property loggingConsoleEnabled - Whether console logging is enabled.
 * @property loggingFileEnabled - Whether file logging is enabled.
 * @property loggingFilePath - The path for the log file.
 * @property loggingExternalEnabled - Whether external logging is enabled.
 * @property loggingExternalUrl - The URL for external logging.
 */
export abstract class SettingsClientOptions {
	abstract drizzleDatabaseUrl: string;
	abstract googleClientId: string;
	abstract googleClientSecret: string;
	abstract googleLoginRedirect: string;
	abstract sessionExpiresInSeconds: number;
	abstract host: string;
	abstract loggingConsoleEnabled: boolean;
	abstract loggingFileEnabled: boolean;
	abstract loggingFilePath: string;
	abstract loggingExternalEnabled: boolean;
	abstract loggingExternalUrl: string;
}

@Injectable()
export class SettingsClient extends SettingsClientOptions {
	public readonly drizzleDatabaseUrl: string;
	public readonly googleClientId: string;
	public readonly googleClientSecret: string;
	public readonly googleLoginRedirect: string;
	public readonly sessionExpiresInSeconds: number;
	public readonly host: string;
	public readonly loggingConsoleEnabled: boolean;
	public readonly loggingFileEnabled: boolean;
	public readonly loggingFilePath: string;
	public readonly loggingExternalEnabled: boolean;
	public readonly loggingExternalUrl: string;

	constructor() {
		super();

		if (process.env.DRIZZLE_DATABASE_URL === undefined) {
			throw new Error("Env variable 'DRIZZLE_DATABASE_URL' is not set");
		}

		if (process.env.GOOGLE_CLIENT_ID === undefined) {
			throw new Error("Env variable 'GOOGLE_CLIENT_ID' is not set");
		}

		if (process.env.GOOGLE_CLIENT_SECRET === undefined) {
			throw new Error("Env variable 'GOOGLE_CLIENT_SECRET' is not set");
		}

		if (process.env.GOOGLE_LOGIN_REDIRECT === undefined) {
			throw new Error("Env variable 'GOOGLE_LOGIN_REDIRECT' is not set");
		}

		if (process.env.HOST === undefined) {
			throw new Error("Env variable 'HOST' is not set");
		}

		this.drizzleDatabaseUrl = process.env.DRIZZLE_DATABASE_URL;
		this.googleClientId = process.env.GOOGLE_CLIENT_ID;
		this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
		this.googleLoginRedirect = process.env.GOOGLE_LOGIN_REDIRECT;
		this.sessionExpiresInSeconds = 60 * 60 * 24; // 24 hours
		this.host = process.env.HOST;
		this.loggingConsoleEnabled =
			process.env.LOGGING_CONSOLE_ENABLED !== 'false'; // default true
		this.loggingFileEnabled = process.env.LOGGING_FILE_ENABLED === 'true'; // default false
		this.loggingFilePath = process.env.LOGGING_FILE_PATH || 'logs/app.log';
		this.loggingExternalEnabled =
			process.env.LOGGING_EXTERNAL_ENABLED === 'true'; // default false
		this.loggingExternalUrl = process.env.LOGGING_EXTERNAL_URL || '';
	}
}
