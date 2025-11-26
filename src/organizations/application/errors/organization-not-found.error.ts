import { ApplicationError } from '@common/errors/application.error';

export class OrganizationNotFoundError extends ApplicationError {
	public readonly code = 'ORGANIZATION_NOT_FOUND';

	constructor(id: string) {
		super(`Organization with id ${id} not found`);
	}
}
