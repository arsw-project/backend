import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ExternalValidationPort } from '@tickets/domain/ports/external-validation.port';
import { firstValueFrom } from 'rxjs';

interface UserResponse {
	id: string;
	name: string;
	email: string;
}

interface UsersListResponse {
	users: UserResponse[];
}

interface OrganizationResponse {
	organization: {
		id: string;
		name: string;
		description: string;
	};
}

/**
 * Adaptador HTTP para validación externa contra el monolito.
 *
 * NOTA: La validación de usuarios actualmente usa GET /users y filtra.
 * Esto es ineficiente pero necesario mientras no exista GET /users/:id.
 *
 * TODO: Optimizar cuando el monolito implemente GET /users/:id
 */
@Injectable()
export class HttpExternalValidationAdapter extends ExternalValidationPort {
	private readonly logger = new Logger(HttpExternalValidationAdapter.name);
	private readonly monolithUrl: string;

	constructor(private readonly httpService: HttpService) {
		super();
		this.monolithUrl = process.env.MONOLITH_URL || 'http://localhost:3000';
	}

	/**
	 * Valida si un usuario existe en el monolito.
	 *
	 * IMPLEMENTACIÓN ACTUAL (INEFICIENTE):
	 * - Obtiene TODOS los usuarios con GET /users
	 * - Filtra localmente por ID
	 *
	 * TODO: Cuando exista GET /users/:id, reemplazar con:
	 * ```typescript
	 * async validateUser(userId: string): Promise<boolean> {
	 *   try {
	 *     const response = await firstValueFrom(
	 *       this.httpService.get<{ user: UserResponse }>(
	 *         `${this.monolithUrl}/users/${userId}`
	 *       )
	 *     );
	 *     return response.status === 200 && response.data?.user != null;
	 *   } catch (error) {
	 *     if (error.response?.status === 404) {
	 *       this.logger.warn(`User ${userId} not found in monolith`);
	 *       return false;
	 *     }
	 *     this.logger.error(`Error validating user ${userId}:`, error.message);
	 *     throw error;
	 *   }
	 * }
	 * ```
	 */
	async validateUser(userId: string): Promise<boolean> {
		try {
			this.logger.debug(`Validating user ${userId} against monolith`);

			const response = await firstValueFrom(
				this.httpService.get<UsersListResponse>(
					`${this.monolithUrl}/users`,
				),
			);

			if (response.status !== 200 || !response.data?.users) {
				this.logger.warn(`Unexpected response from monolith: ${response.status}`);
				return false;
			}

			// Filtrar localmente (INEFICIENTE - TODO: usar GET /users/:id)
			const userExists = response.data.users.some(
				(user) => user.id === userId,
			);

			if (!userExists) {
				this.logger.warn(`User ${userId} not found in monolith users list`);
			}

			return userExists;
		} catch (error) {
			this.logger.error(`Error validating user ${userId}:`, error.message);
			// En caso de error de conexión, lanzamos el error
			// No asumimos que el usuario no existe por un error de red
			throw new Error(`Failed to validate user: ${error.message}`);
		}
	}

	/**
	 * Valida si una organización existe en el monolito.
	 * Usa GET /organizations/:id directamente.
	 */
	async validateOrganization(organizationId: string): Promise<boolean> {
		try {
			this.logger.debug(
				`Validating organization ${organizationId} against monolith`,
			);

			const response = await firstValueFrom(
				this.httpService.get<OrganizationResponse>(
					`${this.monolithUrl}/organizations/${organizationId}`,
				),
			);

			return (
				response.status === 200 && response.data?.organization != null
			);
		} catch (error) {
			// Si es 404, la organización no existe
			if (error.response?.status === 404) {
				this.logger.warn(
					`Organization ${organizationId} not found in monolith`,
				);
				return false;
			}

			this.logger.error(
				`Error validating organization ${organizationId}:`,
				error.message,
			);
			throw new Error(`Failed to validate organization: ${error.message}`);
		}
	}

	/**
	 * Valida tanto usuario como organización en paralelo.
	 */
	async validateUserAndOrganization(
		userId: string,
		organizationId: string,
	): Promise<{ userExists: boolean; organizationExists: boolean }> {
		this.logger.debug(
			`Validating user ${userId} and organization ${organizationId}`,
		);

		const [userExists, organizationExists] = await Promise.all([
			this.validateUser(userId),
			this.validateOrganization(organizationId),
		]);

		return { userExists, organizationExists };
	}
}
