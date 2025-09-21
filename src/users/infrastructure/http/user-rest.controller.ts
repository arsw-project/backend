import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	Body,
	ConflictException,
	Controller,
	Get,
	InternalServerErrorException,
	Post,
	UsePipes,
} from '@nestjs/common';
import {
	type CreateUserDto,
	createUserSchema,
} from '@users/application/dto/create-user.dto';
import { CreateUserUseCase } from '@users/application/use-cases/create-user.case';
import { GetAllUsersUseCase } from '@users/application/use-cases/get-all-users.case';

@Controller('users')
export class UserRestController {
	constructor(
		private readonly getAllUsersUseCase: GetAllUsersUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
	) {}

	@Get()
	async getAllUsers() {
		const result = await this.getAllUsersUseCase.execute();

		if (!result.ok) {
			throw new InternalServerErrorException(); // Handle error appropriately
		}

		return { users: result.value };
	}

	@Post()
	@UsePipes(new ZodValidationPipe(createUserSchema))
	async createUser(@Body() createUserDto: CreateUserDto) {
		const result = await this.createUserUseCase.execute(createUserDto);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException(); // Handle unexpected errors
			}

			switch (error.code) {
				case 'USER_CONFLICT':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error.issues,
					});
			}

			throw new InternalServerErrorException(); // Fallback for unhandled application errors
		}

		return { user: result.value };
	}
}
