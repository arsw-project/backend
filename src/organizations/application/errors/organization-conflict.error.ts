import { ValidationError } from '@common/errors/application.error';

export class OrganizationNameConflictError extends ValidationError {
	public readonly code = 'ORGANIZATION_NAME_CONFLICT';

	constructor() {
		super('Organization name conflict error', [
			{
				code: 'custom',
				message: 'Organization name is already in use',
				path: ['name'],
			},
		]);
	}
}

export class OrganizationConflictError extends ValidationError {
	public readonly code = 'ORGANIZATION_CONFLICT';

	constructor() {
		super('Organization conflict error', []);
	}

	public addNameConflictIssue() {
		this.issues.push({
			code: 'custom',
			message: 'Organization name is already in use',
			path: ['name'],
		});
	}
}
