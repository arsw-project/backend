import { error, ok, Result } from '@common/utility/results';
import type { Participant } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { ParticipantNotFoundError } from '../errors/room.errors';

export interface LeaveRoomResult {
	participant: Participant;
	roomClosed: boolean;
	ticketId: string;
}

export class LeaveRoomUseCase {
	private socketToRoom: Map<string, string>;

	constructor(
		private readonly roomRepository: RoomRepository,
		socketToRoomMap: Map<string, string>,
	) {
		this.socketToRoom = socketToRoomMap;
	}

	execute(socketId: string): Result<LeaveRoomResult, ParticipantNotFoundError> {
		const ticketId = this.socketToRoom.get(socketId);

		if (!ticketId) {
			return error(new ParticipantNotFoundError(socketId));
		}

		const room = this.roomRepository.findByTicketId(ticketId);

		if (!room) {
			this.socketToRoom.delete(socketId);
			return error(new ParticipantNotFoundError(socketId));
		}

		const participant = this.roomRepository.removeParticipant(
			ticketId,
			socketId,
		) as Participant;
		this.socketToRoom.delete(socketId);

		let roomClosed = false;

		if (this.roomRepository.isRoomEmpty(ticketId)) {
			this.roomRepository.delete(ticketId);
			roomClosed = true;
		}

		return ok({
			participant,
			roomClosed,
			ticketId,
		});
	}
}
