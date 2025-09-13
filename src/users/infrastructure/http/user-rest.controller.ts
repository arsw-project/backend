import { Body, Controller, Get, Post } from '@nestjs/common';
import type { CreateUserDto } from '@users/application/dto/create-user.dto';
import { CreateUserUseCase } from '@users/application/use-cases/create-user.case';
import { GetAllUsersUseCase } from '@users/application/use-cases/get-all-users.case';
import { UserRepository } from '@users/domain/ports/user-repository.port';

@Controller('users')
export class UserRestController {
	constructor(private readonly userRepository: UserRepository) {}

	@Get()
	getAllUsers() {
		const useCase = new GetAllUsersUseCase(this.userRepository);
		return useCase.execute();
	}

	@Post()
	createUser(@Body() createUserDto: CreateUserDto) {
		const useCase = new CreateUserUseCase(this.userRepository);
		return useCase.execute(createUserDto);
	}
}
