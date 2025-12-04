import type { SessionUser } from '@auth/domain/entities/session-user.entity';
import { Injectable } from '@nestjs/common';
import type { Participant, Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';

// Default inactivity timeout: 30 minutes
const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

@Injectable()
export class InMemoryRoomRepository extends RoomRepository {
	private rooms: Map<string, Room> = new Map();

	create(ticketId: string, orgId: string): Room {
		const room: Room = {
			ticketId,
			orgId,
			createdAt: new Date(),
			lastActivityAt: new Date(),
			inactivityTimeoutMs: DEFAULT_INACTIVITY_TIMEOUT_MS,
			participants: new Map(),
		};
		this.rooms.set(ticketId, room);
		return room;
	}

	findByTicketId(ticketId: string): Room | undefined {
		return this.rooms.get(ticketId);
	}

	delete(ticketId: string): boolean {
		return this.rooms.delete(ticketId);
	}

	getAll(): Room[] {
		return Array.from(this.rooms.values());
	}

	// Participant management
	addParticipant(
		ticketId: string,
		socketId: string,
		user: SessionUser,
	): Participant | undefined {
		const room = this.rooms.get(ticketId);
		if (!room) return undefined;

		const participant: Participant = {
			socketId,
			user,
			joinedAt: new Date(),
		};
		room.participants.set(socketId, participant);
		this.touch(ticketId);
		return participant;
	}

	removeParticipant(
		ticketId: string,
		socketId: string,
	): Participant | undefined {
		const room = this.rooms.get(ticketId);
		if (!room) return undefined;

		const participant = room.participants.get(socketId);
		room.participants.delete(socketId);
		this.touch(ticketId);
		return participant;
	}

	getParticipant(ticketId: string, socketId: string): Participant | undefined {
		const room = this.rooms.get(ticketId);
		return room?.participants.get(socketId);
	}

	getAllParticipants(ticketId: string): Participant[] {
		const room = this.rooms.get(ticketId);
		if (!room) return [];
		return Array.from(room.participants.values());
	}

	getOtherParticipants(
		ticketId: string,
		excludeSocketId: string,
	): Participant[] {
		return this.getAllParticipants(ticketId).filter(
			(p) => p.socketId !== excludeSocketId,
		);
	}

	getParticipantCount(ticketId: string): number {
		const room = this.rooms.get(ticketId);
		return room?.participants.size ?? 0;
	}

	isRoomEmpty(ticketId: string): boolean {
		return this.getParticipantCount(ticketId) === 0;
	}

	// Activity management
	touch(ticketId: string): void {
		const room = this.rooms.get(ticketId);
		if (room) {
			room.lastActivityAt = new Date();
		}
	}

	isInactive(ticketId: string): boolean {
		const room = this.rooms.get(ticketId);
		if (!room) return true;

		const now = Date.now();
		const lastActivity = room.lastActivityAt.getTime();
		return now - lastActivity > room.inactivityTimeoutMs;
	}

	getTimeUntilInactive(ticketId: string): number {
		const room = this.rooms.get(ticketId);
		if (!room) return 0;

		const elapsed = Date.now() - room.lastActivityAt.getTime();
		return Math.max(0, room.inactivityTimeoutMs - elapsed);
	}
}
