import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class CreateUserUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(createUserDto: CreateUserDto) {
		const emailResult = this.userRepository.findByEmail(createUserDto.email);

		const providerIdResult = this.userRepository.findByProviderId(
			createUserDto.authProvider,
			createUserDto.providerId || '', // TODO: handle optional providerId better
		);

		const [emailExists, providerIdExists] = await Promise.all([
			emailResult,
			providerIdResult,
		]);

		if (emailExists) {
			throw new Error('Email already in use');
		}

		if (providerIdExists) {
			throw new Error('Provider ID already in use');
		}

		const user = await this.userRepository.create(createUserDto);

		return user;
	}
}
