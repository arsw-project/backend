import { ValidationError } from '@common/errors/application.error';

export class UserEmailConflictError extends ValidationError {
	public readonly code = 'USER_EMAIL_CONFLICT';

	constructor() {
		super('User email conflict error', [
			{
				code: 'custom',
				message: 'Email is already in use',
				path: ['email'],
			},
		]);
	}
}

export class UserProviderIdConflictError extends ValidationError {
	public readonly code = 'USER_PROVIDER_ID_CONFLICT';

	constructor() {
		super('User provider ID conflict error', [
			{
				code: 'custom',
				message: 'Provider ID is already in use',
				path: ['providerId'],
			},
		]);
	}
}

export class UserConflictError extends ValidationError {
	public readonly code = 'USER_CONFLICT';

	constructor() {
		super('User conflict error', []);
	}

	public addEmailConflictIssue() {
		this.issues.push({
			code: 'custom',
			message: 'Email is already in use',
			path: ['email'],
		});
	}

	public addProviderIdConflictIssue() {
		this.issues.push({
			code: 'custom',
			message: 'Provider ID is already in use',
			path: ['providerId'],
		});
	}
}
