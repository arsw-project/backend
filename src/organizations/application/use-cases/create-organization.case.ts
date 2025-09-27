import { error, ok, Result } from '@common/utility/results';
import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { OrganizationConflictError } from '@organizations/application/errors/organization-conflict.error';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class CreateOrganizationUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(
		createOrganizationDto: CreateOrganizationDto,
	): Promise<Result<Organization, OrganizationConflictError>> {
		const nameResult = this.organizationRepository.findByName(
			createOrganizationDto.name,
		);

		const nameExists = await nameResult;

		if (nameExists) {
			const conflictError = new OrganizationConflictError();
			conflictError.addNameConflictIssue();
			return error(conflictError);
		}

		const organization = await this.organizationRepository.create(
			createOrganizationDto,
		);

		return ok(organization);
	}
}
