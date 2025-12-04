import { ok, SuccessResult } from '@common/utility/results';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';

export interface RoomStats {
	totalRooms: number;
	totalParticipants: number;
	rooms: Array<{
		ticketId: string;
		participants: number;
		createdAt: Date;
		lastActivity: Date;
		timeUntilInactive: number;
	}>;
}

export class GetRoomStatsUseCase {
	constructor(private readonly roomRepository: RoomRepository) {}

	execute(): SuccessResult<RoomStats> {
		const rooms = this.roomRepository.getAll();

		return ok({
			totalRooms: rooms.length,
			totalParticipants: rooms.reduce(
				(sum, r) => sum + this.roomRepository.getParticipantCount(r.ticketId),
				0,
			),
			rooms: rooms.map((r) => ({
				ticketId: r.ticketId,
				participants: this.roomRepository.getParticipantCount(r.ticketId),
				createdAt: r.createdAt,
				lastActivity: r.lastActivityAt,
				timeUntilInactive: this.roomRepository.getTimeUntilInactive(r.ticketId),
			})),
		});
	}
}
