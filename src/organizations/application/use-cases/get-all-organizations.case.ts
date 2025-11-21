import { ok, SuccessResult } from '@common/utility/results';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class GetAllOrganizationsUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(): Promise<SuccessResult<Organization[]>> {
		return ok(await this.organizationRepository.findAll());
	}
}
