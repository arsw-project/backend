import { CryptoService } from '@auth/application/services/crypto.service';
import { error, ok, Result } from '@common/utility/results';
import { UpdateUserDto } from '@users/application/dto/update-user.dto';
import { UserConflictError } from '@users/application/errors/user-conflict.error';
import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class UpdateUserUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly cryptoService: CryptoService,
	) {}

	async execute(
		id: string,
		updateUserDto: UpdateUserDto,
	): Promise<Result<User, UserNotFoundError | UserConflictError>> {
		const existingUser = await this.userRepository.findById(id);

		if (!existingUser) {
			return error(new UserNotFoundError(id));
		}

		// Check for email conflict if email is being updated
		if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
			const emailExists = await this.userRepository.findByEmail(
				updateUserDto.email,
			);
			if (emailExists) {
				const conflictError = new UserConflictError();
				conflictError.addEmailConflictIssue();
				return error(conflictError);
			}
		}

		// Hash password if it's being updated
		let hashedPassword: string | undefined;
		if (updateUserDto.password) {
			hashedPassword = await this.cryptoService.hashPassword(
				updateUserDto.password,
			);
		}

		const updatedUser = await this.userRepository.update(id, {
			...updateUserDto,
			...(hashedPassword && { password: hashedPassword }),
		});

		if (!updatedUser) {
			return error(new UserNotFoundError(id));
		}

		return ok(updatedUser);
	}
}
