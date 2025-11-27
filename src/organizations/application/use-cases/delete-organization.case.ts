import { error, ok, Result } from '@common/utility/results';
import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class DeleteOrganizationUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(id: string): Promise<Result<void, OrganizationNotFoundError>> {
		// Verificar si la organización existe antes de eliminar
		const organization = await this.organizationRepository.findById(id);
		if (!organization) {
			return error(new OrganizationNotFoundError(id));
		}

		await this.organizationRepository.delete(id);
		return ok(undefined);
	}
}
