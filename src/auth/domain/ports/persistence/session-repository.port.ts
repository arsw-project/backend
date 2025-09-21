import type { Session } from '@auth/domain/entities/session.entity';

export abstract class SessionRepository {
	abstract create(session: Session): Promise<void>;
	abstract findById(id: string): Promise<Session | null>;
	abstract delete(id: string): Promise<void>;
}
