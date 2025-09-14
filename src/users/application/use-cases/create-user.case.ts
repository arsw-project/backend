import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class CreateUserUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(data: CreateUserDto) {
		const user = await this.userRepository.create(data);
		return user;
	}
}
