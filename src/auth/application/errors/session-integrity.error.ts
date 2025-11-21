import { ApplicationError } from '@common/errors/application.error';

export class MalformedTokenError extends ApplicationError {
	constructor() {
		super('Malformed token');
	}
}

export class SessionNotFoundError extends ApplicationError {
	constructor() {
		super('Session not found');
	}
}

export class InvalidSecretError extends ApplicationError {
	constructor() {
		super('Invalid secret');
	}
}
