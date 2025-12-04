import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Participant } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';

// Inactivity check interval: every 5 minutes
const INACTIVITY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export type OnRoomClosedCallback = (
	ticketId: string,
	participants: Participant[],
) => void;

@Injectable()
export class RoomInactivityChecker implements OnModuleDestroy {
	private readonly logger = new Logger(RoomInactivityChecker.name);
	private inactivityCheckInterval: NodeJS.Timeout | null = null;
	private onRoomClosedCallback?: OnRoomClosedCallback;
	private socketToRoom: Map<string, string>;

	constructor(
		private readonly roomRepository: RoomRepository,
		socketToRoomMap: Map<string, string>,
	) {
		this.socketToRoom = socketToRoomMap;
		this.startInactivityChecker();
	}

	onModuleDestroy() {
		this.stopInactivityChecker();
	}

	/**
	 * Set callback for when a room is closed due to inactivity
	 */
	setOnRoomClosedCallback(callback: OnRoomClosedCallback): void {
		this.onRoomClosedCallback = callback;
	}

	private startInactivityChecker(): void {
		this.inactivityCheckInterval = setInterval(() => {
			this.checkInactiveRooms();
		}, INACTIVITY_CHECK_INTERVAL_MS);
		this.logger.log('Room inactivity checker started');
	}

	private stopInactivityChecker(): void {
		if (this.inactivityCheckInterval) {
			clearInterval(this.inactivityCheckInterval);
			this.inactivityCheckInterval = null;
			this.logger.log('Room inactivity checker stopped');
		}
	}

	private checkInactiveRooms(): void {
		const rooms = this.roomRepository.getAll();

		for (const room of rooms) {
			if (this.roomRepository.isInactive(room.ticketId)) {
				this.logger.warn(
					`Room ${room.ticketId} is inactive. Closing room with ${this.roomRepository.getParticipantCount(room.ticketId)} participants.`,
				);

				const participants = this.roomRepository.getAllParticipants(
					room.ticketId,
				);

				// Remove socket mappings
				for (const participant of participants) {
					this.socketToRoom.delete(participant.socketId);
				}

				// Delete the room
				this.roomRepository.delete(room.ticketId);

				// Notify via callback (gateway will disconnect users)
				if (this.onRoomClosedCallback) {
					this.onRoomClosedCallback(room.ticketId, participants);
				}
			}
		}
	}
}
