import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { ok, SuccessResult } from '@common/utility/results';

export class SaveChatMessageUseCase {
	constructor(private readonly chatRepository: ChatRepository) {}

	async execute(params: {
		ticketId: string;
		orgId: string;
		userId: string;
		userName: string;
		content: string;
	}): Promise<SuccessResult<ChatMessage>> {
		const message: ChatMessage = {
			id: crypto.randomUUID(),
			ticketId: params.ticketId,
			orgId: params.orgId,
			userId: params.userId,
			userName: params.userName,
			content: params.content,
			createdAt: new Date(),
		};
		const saved = await this.chatRepository.save(message);
		return ok(saved);
	}
}
