import { error, ok, Result } from '@common/utility/results';
import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class DeleteUserUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(id: string): Promise<Result<void, UserNotFoundError>> {
		const existingUser = await this.userRepository.findById(id);

		if (!existingUser) {
			return error(new UserNotFoundError(id));
		}

		await this.userRepository.delete(id);

		return ok(undefined);
	}
}
