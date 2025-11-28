import { error, ok, Result } from '@common/utility/results';
import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class UpdateTicketAssigneeUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(
		id: string,
		assigneeId: string | null,
	): Promise<Result<Ticket, TicketNotFoundError>> {
		const updatedTicket = await this.ticketRepository.updateAssignee(
			id,
			assigneeId,
		);

		if (!updatedTicket) {
			return error(new TicketNotFoundError(id));
		}

		return ok(updatedTicket);
	}
}
