import { error, ok, Result } from '@common/utility/results';
import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { SessionUserDto } from '@users/application/dto/session-user.dto';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export interface MemberWithUser {
	id: string;
	userId: string;
	organizationId: string;
	role: string;
	user: {
		id: string;
		name: string;
		email: string;
	};
}

export class GetMembersUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly membershipRepository: MembershipRepository,
		private readonly organizationRepository: OrganizationRepository,
	) {}

	async execute(
		currentUser: SessionUserDto,
	): Promise<Result<MemberWithUser[], OrganizationNotFoundError>> {
		// Si el usuario tiene rol system, retorna todos los usuarios
		if (currentUser.role === 'system') {
			const allUsers = await this.userRepository.findAll();
			return ok(this.mapUsersToMembers(allUsers));
		}

		// Si no tiene membresía, no puede ver miembros
		if (!currentUser.membership) {
			return ok([]);
		}

		const organizationId = currentUser.membership.organizationId;

		// Verificar que la organización existe
		const organization =
			await this.organizationRepository.findById(organizationId);
		if (!organization) {
			return error(new OrganizationNotFoundError(organizationId));
		}

		// Obtener todos los miembros de la organización del usuario
		const memberships =
			await this.membershipRepository.findByOrganization(organizationId);

		// Obtener la información de cada usuario
		const membersWithUsers: MemberWithUser[] = [];
		for (const membership of memberships) {
			const user = await this.userRepository.findById(membership.userId);
			if (user) {
				membersWithUsers.push({
					id: membership.id,
					userId: membership.userId,
					organizationId: membership.organizationId,
					role: membership.role,
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
					},
				});
			}
		}

		return ok(membersWithUsers);
	}

	private mapUsersToMembers(users: User[]): MemberWithUser[] {
		return users.map((user) => ({
			id: user.id,
			userId: user.id,
			organizationId: '',
			role: user.role,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		}));
	}
}
