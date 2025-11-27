import { error, ok, Result } from '@common/utility/results';
import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { OrganizationConflictError } from '@organizations/application/errors/organization-conflict.error';
import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class UpdateOrganizationUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(
		id: string,
		update: Partial<CreateOrganizationDto>,
	): Promise<
		Result<Organization, OrganizationConflictError | OrganizationNotFoundError>
	> {
		// Verificar si la organización existe
		const organization = await this.organizationRepository.findById(id);
		if (!organization) {
			return error(new OrganizationNotFoundError(id));
		}

		// Verificar conflicto de nombre si se está actualizando
		if (update.name) {
			const existing = await this.organizationRepository.findByName(
				update.name,
			);
			if (existing && existing.id !== id) {
				const conflict = new OrganizationConflictError();
				conflict.addNameConflictIssue();
				return error(conflict);
			}
		}

		const updated = await this.organizationRepository.update(id, update);
		if (!updated) {
			return error(new OrganizationNotFoundError(id));
		}

		return ok(updated);
	}
}
