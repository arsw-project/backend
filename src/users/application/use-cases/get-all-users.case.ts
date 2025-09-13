import { UserRepository } from '@users/domain/ports/user-repository.port';

export class GetAllUsersUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute() {
		return await this.userRepository.findAll();
	}
}
