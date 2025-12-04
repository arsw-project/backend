import type { SessionUser } from '@auth/domain/entities/session-user.entity';
import type { Participant, Room } from '../entities/room.entity';

export abstract class RoomRepository {
	abstract create(ticketId: string, orgId: string): Room;
	abstract findByTicketId(ticketId: string): Room | undefined;
	abstract delete(ticketId: string): boolean;
	abstract getAll(): Room[];

	// Participant management
	abstract addParticipant(
		ticketId: string,
		socketId: string,
		user: SessionUser,
	): Participant | undefined;
	abstract removeParticipant(
		ticketId: string,
		socketId: string,
	): Participant | undefined;
	abstract getParticipant(
		ticketId: string,
		socketId: string,
	): Participant | undefined;
	abstract getAllParticipants(ticketId: string): Participant[];
	abstract getOtherParticipants(
		ticketId: string,
		excludeSocketId: string,
	): Participant[];
	abstract getParticipantCount(ticketId: string): number;
	abstract isRoomEmpty(ticketId: string): boolean;

	// Activity management
	abstract touch(ticketId: string): void;
	abstract isInactive(ticketId: string): boolean;
	abstract getTimeUntilInactive(ticketId: string): number;
}
