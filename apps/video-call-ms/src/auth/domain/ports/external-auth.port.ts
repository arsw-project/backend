import type { SessionUser } from '../entities/session-user.entity';

export abstract class ExternalAuthPort {
	/**
	 * Validates a session token against the external auth service.
	 * @returns The user if valid, null otherwise.
	 */
	abstract validateSession(sessionToken: string): Promise<SessionUser | null>;

	/**
	 * Checks if a user is a member of the organization that owns the ticket.
	 */
	abstract validateMembership(
		userId: string,
		ticketId: string,
	): Promise<{ isMember: boolean; orgId?: string }>;
}
