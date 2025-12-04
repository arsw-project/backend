import { error, ok, Result } from '@common/utility/results';
import {
	CannotRemoveLastOwnerError,
	MembershipNotFoundError,
} from '@organizations/application/errors/membership.error';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';

export class RemoveMemberUseCase {
	constructor(private readonly membershipRepository: MembershipRepository) {}

	async execute(
		membershipId: string,
	): Promise<
		Result<void, MembershipNotFoundError | CannotRemoveLastOwnerError>
	> {
		// Check if membership exists
		const membership = await this.membershipRepository.findById(membershipId);
		if (!membership) {
			return error(new MembershipNotFoundError(membershipId));
		}

		// If removing an owner, check if there are other owners
		if (membership.role === 'owner') {
			const ownerCount =
				await this.membershipRepository.countOwnersByOrganization(
					membership.organizationId,
				);
			if (ownerCount <= 1) {
				return error(new CannotRemoveLastOwnerError());
			}
		}

		await this.membershipRepository.delete(membershipId);

		return ok(undefined);
	}
}
