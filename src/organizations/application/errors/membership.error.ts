import {
	ApplicationError,
	ValidationError,
} from '@common/errors/application.error';

export class MembershipNotFoundError extends ApplicationError {
	public readonly code = 'MEMBERSHIP_NOT_FOUND';

	constructor(identifier: string) {
		super(`Membership with identifier "${identifier}" not found`);
	}
}

export class MembershipAlreadyExistsError extends ValidationError {
	public readonly code = 'MEMBERSHIP_ALREADY_EXISTS';

	constructor() {
		super('User is already a member of this organization', [
			{
				code: 'custom',
				message: 'User is already a member of this organization',
				path: ['userId'],
			},
		]);
	}
}

export class CannotRemoveLastOwnerError extends ApplicationError {
	public readonly code = 'CANNOT_REMOVE_LAST_OWNER';

	constructor() {
		super('Cannot remove or demote the last owner of the organization');
	}
}

export class InsufficientPermissionsError extends ApplicationError {
	public readonly code = 'INSUFFICIENT_PERMISSIONS';

	constructor() {
		super('You do not have sufficient permissions to perform this action');
	}
}
