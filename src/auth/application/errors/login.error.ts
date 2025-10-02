import { ValidationError } from '@common/errors/application.error';

export class UserNotFoundError extends ValidationError {
	public readonly code = 'USER_NOT_FOUND';

	constructor() {
		super('User not found', [
			{
				code: 'custom',
				message: 'No user found with the provided email',
				path: ['email'],
			},
		]);
	}
}

export class InvalidCredentialsError extends ValidationError {
	public readonly code = 'INVALID_CREDENTIALS';

	constructor() {
		super('Invalid credentials', [
			{
				code: 'custom',
				message: 'The provided password is incorrect',
				path: ['password'],
			},
		]);
	}
}
