import { ok, SuccessResult } from '@common/utility/results';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class GetOrganizationByIdUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(id: string): Promise<SuccessResult<Organization | null>> {
		return ok(await this.organizationRepository.findById(id));
	}
}
