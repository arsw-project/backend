import { ApplicationError } from '@common/errors/application.error';

export class TicketNotFoundError extends ApplicationError {
	public readonly code = 'TICKET_NOT_FOUND';

	constructor(ticketId: string) {
		super(`Ticket with id '${ticketId}' was not found`);
	}
}
