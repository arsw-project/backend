import { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { ok, SuccessResult } from '@common/utility/results';

export interface PaginatedChatResult {
	messages: ChatMessage[];
	total: number;
}

export class GetChatHistoryPaginatedUseCase {
	constructor(private readonly chatRepository: ChatRepository) {}

	async execute(
		ticketId: string,
		limit: number = 50,
		offset: number = 0,
	): Promise<SuccessResult<PaginatedChatResult>> {
		const [messages, total] = await Promise.all([
			this.chatRepository.findByTicketIdPaginated(ticketId, limit, offset),
			this.chatRepository.countByTicketId(ticketId),
		]);

		return ok({ messages, total });
	}
}
