import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	ConflictErrorDto,
	InternalServerErrorDto,
	NotFoundErrorDto,
	ValidationErrorResponseDto,
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
	Query,
} from '@nestjs/common';
import {
	ApiBody,
	ApiConflictResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
	type CreateOrganizationDto,
	createOrganizationSchema,
	type UpdateOrganizationDto,
	updateOrganizationSchema,
} from '@organizations/application/dto/create-organization.dto';
import { CreateOrganizationUseCase } from '@organizations/application/use-cases/create-organization.case';
import { DeleteOrganizationUseCase } from '@organizations/application/use-cases/delete-organization.case';
import { GetAllOrganizationsUseCase } from '@organizations/application/use-cases/get-all-organizations.case';
import { GetOrganizationByIdUseCase } from '@organizations/application/use-cases/get-organization-by-id.case';
import { GetOrganizationByNameUseCase } from '@organizations/application/use-cases/get-organization-by-name.case';
import { UpdateOrganizationUseCase } from '@organizations/application/use-cases/update-organization.case';
import {
	CreateOrganizationRequestDto,
	GetAllOrganizationsResponseDto,
	GetOrganizationResponseDto,
	UpdateOrganizationRequestDto,
} from '../swagger/organization.swagger';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationRestController {
	constructor(
		private readonly getAllOrganizationsUseCase: GetAllOrganizationsUseCase,
		private readonly createOrganizationUseCase: CreateOrganizationUseCase,
		private readonly getOrganizationByIdUseCase: GetOrganizationByIdUseCase,
		private readonly getOrganizationByNameUseCase: GetOrganizationByNameUseCase,
		private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
		private readonly deleteOrganizationUseCase: DeleteOrganizationUseCase,
	) {}

	@Get()
	@ApiOperation({
		summary: 'Listar organizaciones o buscar por nombre',
		description:
			'Retorna todas las organizaciones o busca una específica por nombre si se proporciona el parámetro query',
	})
	@ApiQuery({
		name: 'name',
		required: false,
		description: 'Nombre de la organización a buscar',
		example: 'Acme Corp',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de organizaciones o organización encontrada',
		type: GetAllOrganizationsResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Organización no encontrada (cuando se busca por nombre)',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getAllOrganizations(@Query('name') name?: string) {
		// Si se proporciona el parámetro name, buscar por nombre
		if (name) {
			const result = await this.getOrganizationByNameUseCase.execute(name);

			if (!result.ok) {
				throw new InternalServerErrorException();
			}

			if (!result.value) {
				throw new NotFoundException({
					message: 'Organization not found',
					code: 'ORGANIZATION_NOT_FOUND',
				});
			}

			return { organization: result.value };
		}

		// Si no hay parámetros, devolver todas las organizaciones
		const result = await this.getAllOrganizationsUseCase.execute();

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { organizations: result.value };
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Crear organización',
		description: 'Crea una nueva organización en el sistema',
	})
	@ApiBody({ type: CreateOrganizationRequestDto })
	@ApiResponse({
		status: 201,
		description: 'Organización creada exitosamente',
		type: GetOrganizationResponseDto,
	})
	@ApiConflictResponse({
		description: 'Ya existe una organización con ese nombre',
		type: ConflictErrorDto,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Error de validación en los datos de entrada',
		type: ValidationErrorResponseDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async createOrganization(
		@Body(new ZodValidationPipe(createOrganizationSchema))
		createOrganizationDto: CreateOrganizationDto,
	) {
		const result = await this.createOrganizationUseCase.execute(
			createOrganizationDto,
		);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'ORGANIZATION_CONFLICT':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error.issues,
					});
			}

			throw new InternalServerErrorException();
		}

		return { organization: result.value };
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener organización por ID',
		description:
			'Retorna una organización específica por su identificador único',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiResponse({
		status: 200,
		description: 'Organización encontrada',
		type: GetOrganizationResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Organización no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getById(@Param('id') id: string) {
		const result = await this.getOrganizationByIdUseCase.execute(id);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		if (!result.value) {
			throw new NotFoundException({
				message: 'Organization not found',
				code: 'ORGANIZATION_NOT_FOUND',
			});
		}

		return { organization: result.value };
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Actualizar organización',
		description: 'Actualiza los datos de una organización existente',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiBody({ type: UpdateOrganizationRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Organización actualizada exitosamente',
		type: GetOrganizationResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Organización no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiConflictResponse({
		description: 'Ya existe una organización con ese nombre',
		type: ConflictErrorDto,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Error de validación en los datos de entrada',
		type: ValidationErrorResponseDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateOrganization(
		@Param('id') id: string,
		@Body(new ZodValidationPipe(updateOrganizationSchema))
		updateOrganizationDto: UpdateOrganizationDto,
	) {
		const result = await this.updateOrganizationUseCase.execute(
			id,
			updateOrganizationDto,
		);

		if (!result.ok) {
			const err = result.error;
			if (!ApplicationError.isApplicationError(err)) {
				throw new InternalServerErrorException();
			}

			switch (err.code) {
				case 'ORGANIZATION_CONFLICT':
					throw new ConflictException({
						message: err.message,
						code: err.code,
						errors: err.issues,
					});
				case 'ORGANIZATION_NOT_FOUND':
					throw new NotFoundException({
						message: err.message,
						code: err.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { organization: result.value };
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Eliminar organización',
		description: 'Elimina una organización del sistema de forma permanente',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiResponse({
		status: 204,
		description: 'Organización eliminada exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Organización no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async deleteOrganization(@Param('id') id: string) {
		const result = await this.deleteOrganizationUseCase.execute(id);

		if (!result.ok) {
			const err = result.error;
			if (!ApplicationError.isApplicationError(err)) {
				throw new InternalServerErrorException();
			}

			switch (err.code) {
				case 'ORGANIZATION_NOT_FOUND':
					throw new NotFoundException({
						message: err.message,
						code: err.code,
					});
			}

			throw new InternalServerErrorException();
		}
	}
}
