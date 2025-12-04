import { GetSessionUseCase } from '@auth/application/use-cases/get-session.case';
import { ServiceTokenGuard } from '@internal/infrastructure/guards/service-token.guard';
import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

/**
 * Controlador interno para validación de entidades entre servicios.
 *
 * Estos endpoints están protegidos por X-Service-Token y no requieren
 * autenticación de usuario. Son para uso exclusivo de otros microservicios.
 */
@ApiExcludeController()
@Controller('internal')
@UseGuards(ServiceTokenGuard)
export class InternalRestController {
	private readonly logger = new Logger(InternalRestController.name);

	constructor(
		private readonly userRepository: UserRepository,
		private readonly organizationRepository: OrganizationRepository,
		private readonly membershipRepository: MembershipRepository,
		private readonly getSessionUseCase: GetSessionUseCase,
	) {}

	/**
	 * Verifica si un usuario existe por su ID.
	 */
	@Get('users/:id/exists')
	async checkUserExists(@Param('id') id: string): Promise<{ exists: boolean }> {
		try {
			const user = await this.userRepository.findById(id);
			return { exists: user !== null };
		} catch (error) {
			this.logger.warn(`Error checking user ${id}: ${error.message}`);
			return { exists: false };
		}
	}

	/**
	 * Verifica si una organización existe por su ID.
	 */
	@Get('organizations/:id/exists')
	async checkOrganizationExists(
		@Param('id') id: string,
	): Promise<{ exists: boolean }> {
		try {
			const organization = await this.organizationRepository.findById(id);
			return { exists: organization !== null };
		} catch (error) {
			this.logger.warn(`Error checking organization ${id}: ${error.message}`);
			return { exists: false };
		}
	}

	/**
	 * Verifica si un usuario es miembro de una organización.
	 */
	@Get('organizations/:organizationId/members/:userId/exists')
	async checkMembershipExists(
		@Param('organizationId') organizationId: string,
		@Param('userId') userId: string,
	): Promise<{ isMember: boolean }> {
		try {
			const membership =
				await this.membershipRepository.findByUserAndOrganization(
					userId,
					organizationId,
				);
			return { isMember: membership !== null };
		} catch (error) {
			this.logger.warn(
				`Error checking membership for user ${userId} in org ${organizationId}: ${error.message}`,
			);
			return { isMember: false };
		}
	}

	/**
	 * Valida un token de sesión y retorna los datos del usuario.
	 */
	@Get('sessions/:sessionToken/validate')
	async validateSession(@Param('sessionToken') sessionToken: string): Promise<{
		valid: boolean;
		user?: {
			id: string;
			name: string;
			email: string;
			role: string;
		};
	}> {
		try {
			const result = await this.getSessionUseCase.execute(sessionToken);

			if (!result.ok) {
				return { valid: false };
			}

			const session = result.value;

			// Buscar el usuario por email para obtener su ID
			const user = await this.userRepository.findByEmail(session.user.email);
			if (!user) {
				this.logger.warn(`User not found for email: ${session.user.email}`);
				return { valid: false };
			}

			return {
				valid: true,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			};
		} catch (error) {
			this.logger.warn(`Error validating session: ${error.message}`);
			return { valid: false };
		}
	}
}
