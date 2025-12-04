import { error, ok, Result } from '@common/utility/results';
import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class GetUserByIdUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(id: string): Promise<Result<User, UserNotFoundError>> {
		const user = await this.userRepository.findById(id);

		if (!user) {
			return error(new UserNotFoundError(id));
		}

		return ok(user);
	}
}
