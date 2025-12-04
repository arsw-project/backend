import type { SessionUser } from '@auth/domain/entities/session-user.entity';

export interface Participant {
	socketId: string;
	user: SessionUser;
	joinedAt: Date;
}

export interface Room {
	ticketId: string;
	orgId: string;
	createdAt: Date;
	lastActivityAt: Date;
	inactivityTimeoutMs: number;
	participants: Map<string, Participant>;
}
