import { ok, SuccessResult } from '@common/utility/results';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { SessionUserDto } from '@users/application/dto/session-user.dto';

export class GetOrganizationByIdUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
		private readonly membershipRepository: MembershipRepository,
	) {}

	async execute(
		id: string,
		currentUser: SessionUserDto | null,
	): Promise<SuccessResult<Organization | null>> {
		const organization = await this.organizationRepository.findById(id);

		if (!organization) {
			return ok(null);
		}

		// Si el usuario tiene rol system, puede ver cualquier organización
		if (currentUser?.role === 'system') {
			return ok(organization);
		}

		// Si no está autenticado, no puede ver organizaciones
		if (!currentUser) {
			return ok(null);
		}

		// Para usuarios con rol 'user' o 'admin', verificar que pertenezcan a la organización
		const membership =
			await this.membershipRepository.findByUserAndOrganization(
				currentUser.id,
				id,
			);

		// Solo retorna la organización si el usuario es miembro
		return ok(membership ? organization : null);
	}
}
