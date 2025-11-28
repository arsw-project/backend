import { error, ok, Result } from '@common/utility/results';
import { UpdateTicketDto } from '@tickets/application/dto/update-ticket.dto';
import { TicketConflictError } from '@tickets/application/errors/ticket-conflict.error';
import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class UpdateTicketUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(
		id: string,
		updateTicketDto: UpdateTicketDto,
	): Promise<Result<Ticket, TicketNotFoundError | TicketConflictError>> {
		const existingTicket = await this.ticketRepository.findById(id);

		if (!existingTicket) {
			return error(new TicketNotFoundError(id));
		}

		if (updateTicketDto.title) {
			const ticketsInOrg = await this.ticketRepository.findAllByOrgId(
				existingTicket.orgId,
			);

			const normalizedTitle = updateTicketDto.title.trim().toLowerCase();
			const titleExists = ticketsInOrg.some(
				(ticket) =>
					ticket.id !== id &&
					ticket.title.trim().toLowerCase() === normalizedTitle,
			);

			if (titleExists) {
				const conflictError = new TicketConflictError();
				conflictError.addTitleConflictIssue();
				return error(conflictError);
			}
		}

		const updatedTicket = await this.ticketRepository.update(
			id,
			updateTicketDto,
		);

		if (!updatedTicket) {
			return error(new TicketNotFoundError(id));
		}

		return ok(updatedTicket);
	}
}
