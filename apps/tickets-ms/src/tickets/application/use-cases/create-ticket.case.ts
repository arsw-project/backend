import { error, ok, Result } from '@common/utility/results';
import { CreateTicketDto } from '@tickets/application/dto/create-ticket.dto';
import { TicketConflictError } from '@tickets/application/errors/ticket-conflict.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class CreateTicketUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(
		createTicketDto: CreateTicketDto,
	): Promise<Result<Ticket, TicketConflictError>> {
		const existingTickets = await this.ticketRepository.findAllByOrgId(
			createTicketDto.orgId,
		);

		const normalizedTitle = createTicketDto.title.trim().toLowerCase();
		const titleExists = existingTickets.some(
			(ticket) => ticket.title.trim().toLowerCase() === normalizedTitle,
		);

		if (titleExists) {
			const conflictError = new TicketConflictError();
			conflictError.addTitleConflictIssue();
			return error(conflictError);
		}

		const ticket = await this.ticketRepository.create(createTicketDto);
		return ok(ticket);
	}
}
