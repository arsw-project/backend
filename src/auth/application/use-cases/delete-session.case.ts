import {
	MalformedTokenError,
	SessionNotFoundError,
} from '@auth/application/errors/session-integrity.error';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { error, ok, Result } from '@common/utility/results';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteSessionUseCase {
	constructor(private readonly sessionRepository: SessionRepository) {}

	async execute(
		sessionToken: string,
	): Promise<Result<void, MalformedTokenError | SessionNotFoundError>> {
		const tokenParts = sessionToken.split('.');

		if (tokenParts.length !== 2) {
			return error(new MalformedTokenError());
		}

		const sessionId = tokenParts[0];
		const session = await this.sessionRepository.findById(sessionId);

		if (!session) {
			return error(new SessionNotFoundError());
		}

		await this.sessionRepository.deleteById(sessionId);

		return ok(undefined);
	}
}
