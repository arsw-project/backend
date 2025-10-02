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
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

interface ExecuteParams {
	name: string;
	email: string;
	googleUserId: string;
}

@Injectable()
export class LoginGoogleUserUseCase {
	constructor(
		private readonly cryptoService: CryptoService,
		private readonly sessionRepository: SessionRepository,
		private readonly userRepository: UserRepository,
	) {}

	async execute({
		name,
		email,
		googleUserId,
	}: ExecuteParams): Promise<SuccessResult<SessionWithToken>> {
		let authenticatedUser = await this.userRepository.findByProviderId(
			'google',
			googleUserId,
		);

		if (!authenticatedUser) {
			authenticatedUser = await this.userRepository.create({
				name: name,
				email: email,
				password: this.cryptoService.generateSecureRandomString(48), // Random password since Google handles authentication
				authProvider: 'google',
				providerId: googleUserId,
			});
		}

		const session = await this.createSession(authenticatedUser);

		return ok(session);
	}

	private async createSession(user: User): Promise<SessionWithToken> {
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

		return {
			...session,
			token,
		};
	}
}
