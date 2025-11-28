import { ok, SuccessResult } from '@common/utility/results';
import { Ticket, TicketStatus } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class GetTicketsByStatusUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(status: TicketStatus): Promise<SuccessResult<Ticket[]>> {
		return ok(await this.ticketRepository.findByStatus(status));
	}
}
