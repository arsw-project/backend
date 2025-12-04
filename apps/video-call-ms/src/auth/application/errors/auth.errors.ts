import { ApplicationError } from '@common/errors/application.error';

export class InvalidSessionError extends ApplicationError {
	public readonly code = 'INVALID_SESSION';

	constructor() {
		super('Invalid or expired session');
	}
}

export class MembershipValidationError extends ApplicationError {
	public readonly code = 'MEMBERSHIP_VALIDATION_ERROR';

	constructor(userId: string, ticketId: string) {
		super(
			`User ${userId} is not a member of the organization that owns ticket ${ticketId}`,
		);
	}
}

export class TicketNotFoundError extends ApplicationError {
	public readonly code = 'TICKET_NOT_FOUND';

	constructor(ticketId: string) {
		super(`Ticket ${ticketId} not found`);
	}
}
