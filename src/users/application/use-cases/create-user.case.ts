import { randomUUID } from 'node:crypto';
import { CryptoService } from '@auth/application/services/crypto.service';
import { error, ok, Result } from '@common/utility/results';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UserConflictError } from '@users/application/errors/user-conflict.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class CreateUserUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly cryptoService: CryptoService,
	) {}

	async execute(
		createUserDto: CreateUserDto,
	): Promise<Result<User, UserConflictError>> {
		const dto = { ...createUserDto };

		if (dto.authProvider === 'local') {
			dto.providerId = randomUUID();
		}

		const emailResult = this.userRepository.findByEmail(dto.email);

		const providerIdResult = this.userRepository.findByProviderId(
			dto.authProvider,
			dto.providerId || '', // TODO: handle optional providerId better
		);

		const [emailExists, providerIdExists] = await Promise.all([
			emailResult,
			providerIdResult,
		]);

		if (emailExists || providerIdExists) {
			const conflictError = new UserConflictError();

			if (emailExists) conflictError.addEmailConflictIssue();

			if (providerIdExists) conflictError.addProviderIdConflictIssue();

			return error(conflictError);
		}

		const passwordHash = await this.cryptoService.hashPassword(dto.password);
		const user = await this.userRepository.create({
			...dto,
			password: passwordHash,
		});

		return ok(user);
	}
}
