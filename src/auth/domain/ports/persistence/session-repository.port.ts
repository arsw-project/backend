import type { Session } from '@auth/domain/entities/session.entity';

export abstract class SessionRepository {
	abstract create(session: Session): Promise<void>;
	abstract findById(id: string): Promise<Session | null>;
	abstract deleteById(id: string): Promise<void>;
	abstract deleteByUserId(userId: string): Promise<void>;
}
