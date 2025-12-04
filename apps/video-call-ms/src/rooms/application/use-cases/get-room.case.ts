import { ok, SuccessResult } from '@common/utility/results';
import { Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';

export class GetRoomUseCase {
	private socketToRoom: Map<string, string>;

	constructor(
		private readonly roomRepository: RoomRepository,
		socketToRoomMap: Map<string, string>,
	) {
		this.socketToRoom = socketToRoomMap;
	}

	/**
	 * Get room by ticket ID
	 */
	byTicketId(ticketId: string): Room | undefined {
		return this.roomRepository.findByTicketId(ticketId);
	}

	/**
	 * Get room by socket ID
	 */
	bySocketId(socketId: string): Room | undefined {
		const ticketId = this.socketToRoom.get(socketId);
		if (!ticketId) return undefined;
		return this.roomRepository.findByTicketId(ticketId);
	}

	/**
	 * Get ticket ID for a socket
	 */
	getTicketIdForSocket(socketId: string): string | undefined {
		return this.socketToRoom.get(socketId);
	}

	/**
	 * Get all active rooms
	 */
	getAll(): SuccessResult<Room[]> {
		return ok(this.roomRepository.getAll());
	}
}
