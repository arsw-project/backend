import { ApplicationError } from '@common/errors/application.error';

export class OrganizationNotFoundError extends ApplicationError {
	constructor(orgId: string) {
		super(`Organization with ID '${orgId}' not found in the system`);
		this.name = 'OrganizationNotFoundError';
	}
}
