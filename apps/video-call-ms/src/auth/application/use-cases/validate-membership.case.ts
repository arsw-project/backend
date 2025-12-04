import { ExternalAuthPort } from '@auth/domain/ports/external-auth.port';
import { error, ok, Result } from '@common/utility/results';
import { MembershipValidationError } from '../errors/auth.errors';

export interface MembershipValidationResult {
	isMember: boolean;
	orgId: string;
}

export class ValidateMembershipUseCase {
	constructor(private readonly externalAuth: ExternalAuthPort) {}

	async execute(
		userId: string,
		ticketId: string,
	): Promise<Result<MembershipValidationResult, MembershipValidationError>> {
		const result = await this.externalAuth.validateMembership(userId, ticketId);

		if (!result.isMember || !result.orgId) {
			return error(new MembershipValidationError(userId, ticketId));
		}

		return ok({
			isMember: result.isMember,
			orgId: result.orgId,
		});
	}
}
