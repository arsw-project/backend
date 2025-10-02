import { CryptoService } from '@auth/application/services/crypto.service';
import { CreateSessionUseCase } from '@auth/application/use-cases/create-session.case';
import { SessionWithToken } from '@auth/domain/entities/session.entity';
import { ok, SuccessResult } from '@common/utility/results';
import { Injectable } from '@nestjs/common';
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
		private readonly userRepository: UserRepository,
		private readonly createSessionUseCase: CreateSessionUseCase,
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

		const session = await this.createSessionUseCase.execute(authenticatedUser);

		return ok(session.value);
	}
}
