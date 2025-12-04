import { ApplicationError } from '@common/errors/application.error';

export class RoomNotFoundError extends ApplicationError {
	public readonly code = 'ROOM_NOT_FOUND';

	constructor(ticketId: string) {
		super(`Room for ticket ${ticketId} not found`);
	}
}

export class ParticipantNotFoundError extends ApplicationError {
	public readonly code = 'PARTICIPANT_NOT_FOUND';

	constructor(socketId: string) {
		super(`Participant with socket ${socketId} not found in any room`);
	}
}
