import { RoomRepository } from '@rooms/domain/ports/room.repository.port';

export class TouchRoomUseCase {
	constructor(private readonly roomRepository: RoomRepository) {}

	execute(ticketId: string): void {
		this.roomRepository.touch(ticketId);
	}
}
