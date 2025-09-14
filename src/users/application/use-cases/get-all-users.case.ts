import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class GetAllUsersUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute() {
		return await this.userRepository.findAll();
	}
}
