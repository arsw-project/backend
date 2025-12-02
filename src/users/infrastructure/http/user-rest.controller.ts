import { Role } from '@auth/infrastructure/decorators/role.decorator';
import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	ApiErrorDto,
	InternalServerErrorDto,
	NotFoundErrorDto,
} from '@common/swagger/api-error.dto';
import {
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
	Post,
	UsePipes,
} from '@nestjs/common';
import {
	ApiBody,
	ApiConflictResponse,
	ApiCookieAuth,
	ApiInternalServerErrorResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import {
	type CreateUserDto,
	createUserSchema,
} from '@users/application/dto/create-user.dto';
import {
	type UpdateUserDto,
	updateUserSchema,
} from '@users/application/dto/update-user.dto';
import { CreateUserUseCase } from '@users/application/use-cases/create-user.case';
import { DeleteUserUseCase } from '@users/application/use-cases/delete-user.case';
import { GetAllUsersUseCase } from '@users/application/use-cases/get-all-users.case';
import { GetUserByIdUseCase } from '@users/application/use-cases/get-user-by-id.case';
import { UpdateUserUseCase } from '@users/application/use-cases/update-user.case';
import {
	CreateUserRequestDto,
	CreateUserResponseDto,
	GetAllUsersResponseDto,
	GetUserResponseDto,
	UpdateUserRequestDto,
	UpdateUserResponseDto,
} from '../swagger/user.swagger';

@ApiTags('Users')
@ApiCookieAuth('session-token')
@Controller('users')
export class UserRestController {
	constructor(
		private readonly getAllUsersUseCase: GetAllUsersUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
		private readonly getUserByIdUseCase: GetUserByIdUseCase,
		private readonly updateUserUseCase: UpdateUserUseCase,
		private readonly deleteUserUseCase: DeleteUserUseCase,
	) {}

	@Get()
	@Role('admin')
	@ApiOperation({
		summary: 'Obtener todos los usuarios',
		description:
			'Retorna una lista de todos los usuarios registrados. Requiere rol de administrador.',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de usuarios obtenida exitosamente',
		type: GetAllUsersResponseDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getAllUsers() {
		const result = await this.getAllUsersUseCase.execute();

		if (!result.ok) {
			throw new InternalServerErrorException(); // Handle error appropriately
		}

		return { users: result.value };
	}

	@Post()
	@UsePipes(new ZodValidationPipe(createUserSchema))
	@Role('admin')
	@ApiOperation({
		summary: 'Crear un nuevo usuario',
		description:
			'Crea un nuevo usuario en el sistema. Requiere rol de administrador.',
	})
	@ApiBody({ type: CreateUserRequestDto })
	@ApiResponse({
		status: 201,
		description: 'Usuario creado exitosamente',
		type: CreateUserResponseDto,
	})
	@ApiConflictResponse({
		description: 'El email o providerId ya existe',
		type: ApiErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
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

	@Get(':id')
	@Role('admin')
	@ApiOperation({
		summary: 'Obtener usuario por ID',
		description:
			'Retorna un usuario específico por su ID. Requiere rol de administrador.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único del usuario',
		example: 'clxyz123abc456def789',
	})
	@ApiResponse({
		status: 200,
		description: 'Usuario encontrado',
		type: GetUserResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Usuario no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getUserById(@Param('id') id: string) {
		const result = await this.getUserByIdUseCase.execute(id);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'USER_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { user: result.value };
	}

	@Patch(':id')
	@UsePipes(new ZodValidationPipe(updateUserSchema))
	@Role('admin')
	@ApiOperation({
		summary: 'Actualizar usuario',
		description:
			'Actualiza parcialmente un usuario existente. Requiere rol de administrador.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único del usuario',
		example: 'clxyz123abc456def789',
	})
	@ApiBody({ type: UpdateUserRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Usuario actualizado exitosamente',
		type: UpdateUserResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Usuario no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiConflictResponse({
		description: 'El email ya está en uso por otro usuario',
		type: ApiErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateUser(
		@Param('id') id: string,
		@Body() updateUserDto: UpdateUserDto,
	) {
		const result = await this.updateUserUseCase.execute(id, updateUserDto);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'USER_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
				case 'USER_CONFLICT':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error.issues,
					});
			}

			throw new InternalServerErrorException();
		}

		return { user: result.value };
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Role('admin')
	@ApiOperation({
		summary: 'Eliminar usuario',
		description:
			'Elimina un usuario del sistema. Requiere rol de administrador.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único del usuario',
		example: 'clxyz123abc456def789',
	})
	@ApiNoContentResponse({
		description: 'Usuario eliminado exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Usuario no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async deleteUser(@Param('id') id: string) {
		const result = await this.deleteUserUseCase.execute(id);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'USER_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}
	}
}
