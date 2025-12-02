import { ok, SuccessResult } from '@common/utility/results';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';

export class GetUserMembershipsUseCase {
	constructor(private readonly membershipRepository: MembershipRepository) {}

	async execute(userId: string): Promise<SuccessResult<Membership[]>> {
		const memberships = await this.membershipRepository.findByUser(userId);
		return ok(memberships);
	}
}
