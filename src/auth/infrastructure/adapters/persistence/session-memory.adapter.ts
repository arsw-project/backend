import { Session } from '@auth/domain/entities/session.entity';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';

export class SessionMemoryAdapter extends SessionRepository {
	private sessions: Map<string, Session> = new Map();

	async create(session: Session): Promise<void> {
		this.sessions.set(session.id, session);
	}

	async findById(id: string): Promise<Session | null> {
		return this.sessions.get(id) || null;
	}

	async deleteById(id: string): Promise<void> {
		this.sessions.delete(id);
	}

	async deleteByUserEmail(userEmail: string): Promise<void> {
		for (const [id, session] of this.sessions) {
			if (session.user.email === userEmail) {
				this.sessions.delete(id);
			}
		}
	}
}
