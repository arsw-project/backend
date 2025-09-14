import { ok, SuccessResult } from '@common/utility/results';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class GetAllUsersUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(): Promise<SuccessResult<User[]>> {
		return ok(await this.userRepository.findAll());
	}
}
