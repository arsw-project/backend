import { ok, SuccessResult } from '@common/utility/results';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class GetTicketsByTagUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(tag: string): Promise<SuccessResult<Ticket[]>> {
		return ok(await this.ticketRepository.findByTag(tag));
	}
}
