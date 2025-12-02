import { ApplicationError } from '@common/errors/application.error';

export class UserNotFoundError extends ApplicationError {
	constructor(userId: string) {
		super(`User with ID '${userId}' not found in the system`);
		this.name = 'UserNotFoundError';
	}
}
