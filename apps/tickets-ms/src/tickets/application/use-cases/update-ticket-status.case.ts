import { error, ok, Result } from '@common/utility/results';
import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket, TicketStatus } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class UpdateTicketStatusUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(
		id: string,
		status: TicketStatus,
	): Promise<Result<Ticket, TicketNotFoundError>> {
		const updatedTicket = await this.ticketRepository.updateStatus(id, status);

		if (!updatedTicket) {
			return error(new TicketNotFoundError(id));
		}

		return ok(updatedTicket);
	}
}
