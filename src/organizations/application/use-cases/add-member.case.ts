import { error, ok, Result } from '@common/utility/results';
import { AddMemberDto } from '@organizations/application/dto/membership.dto';
import { MembershipAlreadyExistsError } from '@organizations/application/errors/membership.error';
import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export class AddMemberUseCase {
	constructor(
		private readonly membershipRepository: MembershipRepository,
		private readonly organizationRepository: OrganizationRepository,
		private readonly userRepository: UserRepository,
	) {}

	async execute(
		organizationId: string,
		addMemberDto: AddMemberDto,
	): Promise<
		Result<
			Membership,
			| OrganizationNotFoundError
			| UserNotFoundError
			| MembershipAlreadyExistsError
		>
	> {
		// Check if organization exists
		const organization =
			await this.organizationRepository.findById(organizationId);
		if (!organization) {
			return error(new OrganizationNotFoundError(organizationId));
		}

		// Check if user exists
		const user = await this.userRepository.findById(addMemberDto.userId);
		if (!user) {
			return error(new UserNotFoundError(addMemberDto.userId));
		}

		// Check if membership already exists
		const existingMembership =
			await this.membershipRepository.findByUserAndOrganization(
				addMemberDto.userId,
				organizationId,
			);
		if (existingMembership) {
			return error(new MembershipAlreadyExistsError());
		}

		// Create membership
		const membership = await this.membershipRepository.create({
			userId: addMemberDto.userId,
			organizationId,
			role: addMemberDto.role,
		});

		return ok(membership);
	}
}
