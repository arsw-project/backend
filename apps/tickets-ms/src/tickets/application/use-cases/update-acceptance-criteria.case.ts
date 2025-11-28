import { error, ok, Result } from '@common/utility/results';
import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class UpdateAcceptanceCriteriaUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(
		id: string,
		acceptanceCriteria: string[],
	): Promise<Result<Ticket, TicketNotFoundError>> {
		const existingTicket = await this.ticketRepository.findById(id);

		if (!existingTicket) {
			return error(new TicketNotFoundError(id));
		}

		const updatedTicket = await this.ticketRepository.update(id, {
			acceptanceCriteria,
		});

		if (!updatedTicket) {
			return error(new TicketNotFoundError(id));
		}

		return ok(updatedTicket);
	}
}
