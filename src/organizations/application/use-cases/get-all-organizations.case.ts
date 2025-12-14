import { ok, SuccessResult } from '@common/utility/results';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { SessionUserDto } from '@users/application/dto/session-user.dto';

export class GetAllOrganizationsUseCase {
	constructor(
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(
		currentUser: SessionUserDto | null,
	): Promise<SuccessResult<Organization[]>> {
		// Si el usuario tiene rol system, retorna todas las organizaciones
		if (currentUser?.role === 'system') {
			return ok(await this.organizationRepository.findAll());
		}

		// Si no está autenticado o no tiene membresía, retorna array vacío
		if (!currentUser) {
			return ok([]);
		}

		// Para usuarios con rol 'user' o 'admin', retorna solo sus organizaciones
		return ok(await this.organizationRepository.findByUserId(currentUser.id));
	}
}
