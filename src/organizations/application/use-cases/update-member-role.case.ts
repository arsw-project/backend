import { error, ok, Result } from '@common/utility/results';
import { UpdateMemberRoleDto } from '@organizations/application/dto/membership.dto';
import {
	CannotRemoveLastOwnerError,
	MembershipNotFoundError,
} from '@organizations/application/errors/membership.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';

export class UpdateMemberRoleUseCase {
	constructor(private readonly membershipRepository: MembershipRepository) {}

	async execute(
		membershipId: string,
		updateDto: UpdateMemberRoleDto,
	): Promise<
		Result<Membership, MembershipNotFoundError | CannotRemoveLastOwnerError>
	> {
		// Check if membership exists
		const membership = await this.membershipRepository.findById(membershipId);
		if (!membership) {
			return error(new MembershipNotFoundError(membershipId));
		}

		// If demoting an owner, check if there are other owners
		if (membership.role === 'owner' && updateDto.role !== 'owner') {
			const ownerCount =
				await this.membershipRepository.countOwnersByOrganization(
					membership.organizationId,
				);
			if (ownerCount <= 1) {
				return error(new CannotRemoveLastOwnerError());
			}
		}

		const updatedMembership = await this.membershipRepository.update(
			membershipId,
			{
				role: updateDto.role,
			},
		);

		if (!updatedMembership) {
			return error(new MembershipNotFoundError(membershipId));
		}

		return ok(updatedMembership);
	}
}
