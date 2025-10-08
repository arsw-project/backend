import { ok, SuccessResult } from '@common/utility/results';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class GetOrganizationByNameUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(name: string): Promise<SuccessResult<Organization | null>> {
		return ok(await this.organizationRepository.findByName(name));
	}
}
