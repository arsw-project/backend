import { CryptoService } from '@auth/application/services/crypto.service';
import {
	Session,
	SessionWithToken,
} from '@auth/domain/entities/session.entity';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { ok, SuccessResult } from '@common/utility/results';
import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import {
	SessionMembershipDto,
	sessionUserSchema,
} from '@users/application/dto/session-user.dto';
import { User } from '@users/domain/entities/user.entity';

@Injectable()
export class CreateSessionUseCase {
	constructor(
		private readonly cryptoService: CryptoService,
		private readonly sessionRepository: SessionRepository,
		private readonly membershipRepository: MembershipRepository,
	) {}

	public async execute(user: User): Promise<SuccessResult<SessionWithToken>> {
		const now = new Date();

		const id = this.cryptoService.generateSecureRandomString(24);
		const secret = this.cryptoService.generateSecureRandomString(48);
		const secretHash = await this.cryptoService.hashSecret(secret);

		const token = `${id}.${secret}`;

		const userMemberships = await this.membershipRepository.findByUser(user.id);
		// Usuario solo puede tener una organización - tomamos la primera si existe
		const membership: SessionMembershipDto | null =
			userMemberships.length > 0
				? {
						id: userMemberships[0].id,
						organizationId: userMemberships[0].organizationId,
						role: userMemberships[0].role,
					}
				: null;

		const sessionUser = sessionUserSchema.safeParse({
			...user,
			membership,
		});

		if (!sessionUser.success) {
			throw new Error('Invalid user data for session');
		}

		const session: Session = {
			id,
			secretHash,
			createdAt: now,
			user: sessionUser.data,
		};

		await this.sessionRepository.create(session);

		return ok({
			...session,
			token,
		});
	}
}
