import { ApplicationError } from '@common/errors/application.error';

export class MalformedTokenError extends ApplicationError {
	constructor() {
		super('Malformed token');
	}
}

export class SessionNotFoundError extends ApplicationError {
	public readonly code = 'SESSION_NOT_FOUND';

	constructor() {
		super('Session not found');
	}
}

export class InvalidSecretError extends ApplicationError {
	constructor() {
		super('Invalid secret');
	}
}
