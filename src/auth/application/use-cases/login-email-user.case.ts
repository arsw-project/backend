import { LoginUserDto } from '@auth/application/dto/login-user.dto';
import {
	InvalidCredentialsError,
	UserNotFoundError,
} from '@auth/application/errors/login.error';
import { CryptoService } from '@auth/application/services/crypto.service';
import { CreateSessionUseCase } from '@auth/application/use-cases/create-session.case';
import { SessionWithToken } from '@auth/domain/entities/session.entity';
import { error, ok, Result } from '@common/utility/results';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

@Injectable()
export class LoginEmailUserUseCase {
	constructor(
		private readonly cryptoService: CryptoService,
		private readonly userRepository: UserRepository,
		private readonly createSessionUseCase: CreateSessionUseCase,
	) {}

	async execute({
		email,
		password,
	}: LoginUserDto): Promise<
		Result<SessionWithToken, UserNotFoundError | InvalidCredentialsError>
	> {
		const user = await this.userRepository.findByEmail(email);

		if (!user) {
			return error(new UserNotFoundError());
		}

		const isPasswordValid = await this.cryptoService.verifyPassword(
			user.password,
			password,
		);

		if (!isPasswordValid) {
			return error(new InvalidCredentialsError());
		}

		const session = await this.createSessionUseCase.execute(user);

		return ok(session.value);
	}
}
