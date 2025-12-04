import type { SessionUser } from '@auth/domain/entities/session-user.entity';
import { GetChatHistoryUseCase } from '@chat/application/use-cases/get-chat-history.case';
import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ok, SuccessResult } from '@common/utility/results';
import type { Participant, Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';

export interface JoinRoomResult {
	room: Room;
	participant: Participant;
	chatHistory: ChatMessage[];
}

export class JoinRoomUseCase {
	// Map socketId -> ticketId for quick lookups
	private socketToRoom: Map<string, string>;

	constructor(
		private readonly roomRepository: RoomRepository,
		private readonly getChatHistoryUseCase: GetChatHistoryUseCase,
		socketToRoomMap: Map<string, string>,
	) {
		this.socketToRoom = socketToRoomMap;
	}

	async execute(
		ticketId: string,
		orgId: string,
		socketId: string,
		user: SessionUser,
	): Promise<SuccessResult<JoinRoomResult>> {
		let room = this.roomRepository.findByTicketId(ticketId);

		if (!room) {
			room = this.roomRepository.create(ticketId, orgId);
		}

		const participant = this.roomRepository.addParticipant(
			ticketId,
			socketId,
			user,
		) as Participant;
		this.socketToRoom.set(socketId, ticketId);

		// Load chat history from database
		const chatHistoryResult =
			await this.getChatHistoryUseCase.execute(ticketId);

		return ok({
			room,
			participant,
			chatHistory: chatHistoryResult.value,
		});
	}
}
