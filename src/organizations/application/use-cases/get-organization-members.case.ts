import { error, ok, Result } from '@common/utility/results';
import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

export class GetOrganizationMembersUseCase {
	constructor(
		private readonly membershipRepository: MembershipRepository,
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(
		organizationId: string,
	): Promise<Result<Membership[], OrganizationNotFoundError>> {
		// Check if organization exists
		const organization =
			await this.organizationRepository.findById(organizationId);
		if (!organization) {
			return error(new OrganizationNotFoundError(organizationId));
		}

		const memberships =
			await this.membershipRepository.findByOrganization(organizationId);

		return ok(memberships);
	}
}
