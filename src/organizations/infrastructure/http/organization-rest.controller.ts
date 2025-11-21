import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
	UsePipes,
} from '@nestjs/common';
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
	@UsePipes(new ZodValidationPipe(createOrganizationSchema))
	async createOrganization(
		@Body() createOrganizationDto: CreateOrganizationDto,
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
	@UsePipes(new ZodValidationPipe(updateOrganizationSchema))
	async updateOrganization(
		@Param('id') id: string,
		@Body() updateOrganizationDto: UpdateOrganizationDto,
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

		return { deleted: true };
	}
}
