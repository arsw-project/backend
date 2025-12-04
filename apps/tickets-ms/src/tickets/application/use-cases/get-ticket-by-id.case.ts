import { ok, SuccessResult } from '@common/utility/results';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class GetTicketByIdUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(id: string): Promise<SuccessResult<Ticket | null>> {
		return ok(await this.ticketRepository.findById(id));
	}
}
