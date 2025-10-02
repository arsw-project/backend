import { CryptoService } from '@auth/application/services/crypto.service';
import {
	Session,
	SessionWithToken,
} from '@auth/domain/entities/session.entity';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { ok, SuccessResult } from '@common/utility/results';
import { Injectable } from '@nestjs/common';
import { sessionUserSchema } from '@users/application/dto/session-user.dto';
import { User } from '@users/domain/entities/user.entity';

@Injectable()
export class CreateSessionUseCase {
	constructor(
		private readonly cryptoService: CryptoService,
		private readonly sessionRepository: SessionRepository,
	) {}

	public async execute(user: User): Promise<SuccessResult<SessionWithToken>> {
		const now = new Date();

		const id = this.cryptoService.generateSecureRandomString(24);
		const secret = this.cryptoService.generateSecureRandomString(48);
		const secretHash = await this.cryptoService.hashSecret(secret);

		const token = `${id}.${secret}`;

		const sessionUser = sessionUserSchema.safeParse(user);

		if (!sessionUser.success) {
			throw new Error('Invalid user data for session');
		}

		const session: Session = {
			id,
			secretHash,
			createdAt: now,
			user: sessionUser.data,
		};

		await this.sessionRepository.create(session);

		return ok({
			...session,
			token,
		});
	}
}
