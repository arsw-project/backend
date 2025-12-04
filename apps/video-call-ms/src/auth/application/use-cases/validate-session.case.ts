import { SessionUser } from '@auth/domain/entities/session-user.entity';
import { ExternalAuthPort } from '@auth/domain/ports/external-auth.port';
import { error, ok, Result } from '@common/utility/results';
import { InvalidSessionError } from '../errors/auth.errors';

export class ValidateSessionUseCase {
	constructor(private readonly externalAuth: ExternalAuthPort) {}

	async execute(
		sessionToken: string,
	): Promise<Result<SessionUser, InvalidSessionError>> {
		const user = await this.externalAuth.validateSession(sessionToken);

		if (!user) {
			return error(new InvalidSessionError());
		}

		return ok(user);
	}
}
