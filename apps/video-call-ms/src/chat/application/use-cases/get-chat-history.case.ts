import { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { ok, SuccessResult } from '@common/utility/results';

export class GetChatHistoryUseCase {
	constructor(private readonly chatRepository: ChatRepository) {}

	async execute(ticketId: string): Promise<SuccessResult<ChatMessage[]>> {
		const messages = await this.chatRepository.findByTicketId(ticketId);
		return ok(messages);
	}
}
