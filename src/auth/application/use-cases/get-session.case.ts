import {
	InvalidSecretError,
	MalformedTokenError,
	SessionNotFoundError,
} from '@auth/application/errors/session-integrity.error';
import { CryptoService } from '@auth/application/services/crypto.service';
import { Session } from '@auth/domain/entities/session.entity';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { error, ok, Result } from '@common/utility/results';
import { Injectable } from '@nestjs/common';

const sessionExpiresInSeconds = 60 * 60 * 24;

@Injectable()
export class GetSessionUseCase {
	constructor(
		private readonly cryptoService: CryptoService,
		private readonly sessionRepository: SessionRepository,
	) {}

	async execute(
		token: string,
	): Promise<
		Result<
			Session,
			MalformedTokenError | SessionNotFoundError | InvalidSecretError
		>
	> {
		const tokenParts = token.split('.');
		if (tokenParts.length !== 2) {
			return error(new MalformedTokenError());
		}
		const sessionId = tokenParts[0];
		const sessionSecret = tokenParts[1];

		const session = await this.getSession(sessionId);

		if (!session) {
			return error(new SessionNotFoundError());
		}

		const tokenSecretHash = await this.cryptoService.hashSecret(sessionSecret);
		const validSecret = this.cryptoService.constantTimeEqual(
			tokenSecretHash,
			session.secretHash,
		);
		if (!validSecret) {
			return error(new InvalidSecretError());
		}

		return ok(session);
	}

	async getSession(sessionId: string): Promise<Session | null> {
		const now = new Date();

		const session = await this.sessionRepository.findById(sessionId);

		if (!session) {
			return null;
		}

		if (
			now.getTime() - session.createdAt.getTime() >=
			sessionExpiresInSeconds * 1000
		) {
			await this.sessionRepository.delete(sessionId);
			return null;
		}

		return session;
	}
}
