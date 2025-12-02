import { ApplicationError } from '@common/errors/application.error';

export class ValidationFailedError extends ApplicationError {
	public readonly code = 'VALIDATION_FAILED';

	constructor(
		public readonly userValid: boolean,
		public readonly organizationValid: boolean,
		public readonly deletedUserTickets: number,
		public readonly deletedOrgTickets: number,
	) {
		const messages: string[] = [];

		if (!userValid) {
			messages.push(`User not found (${deletedUserTickets} orphan tickets deleted)`);
		}
		if (!organizationValid) {
			messages.push(
				`Organization not found (${deletedOrgTickets} orphan tickets deleted)`,
			);
		}

		super(`Validation failed: ${messages.join(', ')}`);
		this.name = 'ValidationFailedError';
	}
}
