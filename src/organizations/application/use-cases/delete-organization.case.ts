import { ok, SuccessResult } from '@common/utility/results';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class DeleteOrganizationUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(id: string): Promise<SuccessResult<void>> {
		await this.organizationRepository.delete(id);
		return ok(undefined as unknown as undefined);
	}
}
