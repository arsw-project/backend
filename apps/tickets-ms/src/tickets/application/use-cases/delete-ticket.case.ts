import { error, ok, Result } from '@common/utility/results';
import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class DeleteTicketUseCase {
	constructor(private readonly ticketRepository: TicketRepository) {}

	async execute(id: string): Promise<Result<boolean, TicketNotFoundError>> {
		const deleted = await this.ticketRepository.delete(id);

		if (!deleted) {
			return error(new TicketNotFoundError(id));
		}

		return ok(true);
	}
}
