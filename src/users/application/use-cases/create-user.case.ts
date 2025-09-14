import { error, ok, Result } from '@common/utility/results';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UserConflictError } from '@users/application/errors/user-conflict.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class CreateUserUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(
		createUserDto: CreateUserDto,
	): Promise<Result<User, UserConflictError>> {
		const emailResult = this.userRepository.findByEmail(createUserDto.email);

		const providerIdResult = this.userRepository.findByProviderId(
			createUserDto.authProvider,
			createUserDto.providerId || '', // TODO: handle optional providerId better
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

		const user = await this.userRepository.create(createUserDto);

		return ok(user);
	}
}
