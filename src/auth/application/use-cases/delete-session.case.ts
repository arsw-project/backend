import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';

export class DeleteSessionUseCase {
	constructor(private readonly sessionRepository: SessionRepository) {}

	async execute(sessionId: string): Promise<void> {
		await this.sessionRepository.delete(sessionId);
	}
}
