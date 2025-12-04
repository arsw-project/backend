import { SaveChatMessageUseCase } from '@chat/application/use-cases/save-chat-message.case';
import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { error, ok, Result } from '@common/utility/results';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { RoomNotFoundError } from '../errors/room.errors';

export class AddChatMessageUseCase {
	constructor(
		private readonly roomRepository: RoomRepository,
		private readonly saveChatMessageUseCase: SaveChatMessageUseCase,
	) {}

	async execute(params: {
		ticketId: string;
		orgId: string;
		userId: string;
		userName: string;
		content: string;
	}): Promise<Result<ChatMessage, RoomNotFoundError>> {
		const room = this.roomRepository.findByTicketId(params.ticketId);

		if (!room) {
			return error(new RoomNotFoundError(params.ticketId));
		}

		// Touch room to update activity
		this.roomRepository.touch(params.ticketId);

		// Persist to database
		const result = await this.saveChatMessageUseCase.execute(params);

		return ok(result.value);
	}
}
