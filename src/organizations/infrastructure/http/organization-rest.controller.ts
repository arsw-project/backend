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
	type CreateOrganizationDto,
	createOrganizationSchema,
} from '@organizations/application/dto/create-organization.dto';
import { CreateOrganizationUseCase } from '@organizations/application/use-cases/create-organization.case';
import { GetAllOrganizationsUseCase } from '@organizations/application/use-cases/get-all-organizations.case';

@Controller('organizations')
export class OrganizationRestController {
	constructor(
		private readonly getAllOrganizationsUseCase: GetAllOrganizationsUseCase,
		private readonly createOrganizationUseCase: CreateOrganizationUseCase,
	) {}

	@Get()
	async getAllOrganizations() {
		const result = await this.getAllOrganizationsUseCase.execute();

		if (!result.ok) {
			throw new InternalServerErrorException(); // Handle error appropriately
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
				throw new InternalServerErrorException(); // Handle unexpected errors
			}

			switch (error.code) {
				case 'ORGANIZATION_CONFLICT':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error.issues,
					});
			}

			throw new InternalServerErrorException(); // Fallback for unhandled application errors
		}

		return { organization: result.value };
	}
}
