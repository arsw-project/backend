import { ApplicationError } from '@common/errors/application.error';

export class UserNotFoundError extends ApplicationError {
	public readonly code = 'USER_NOT_FOUND';

	constructor(identifier: string) {
		super(`User with identifier "${identifier}" not found`);
	}
}
