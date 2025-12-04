import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ExternalValidationPort } from '@tickets/domain/ports/external-validation.port';
import { firstValueFrom } from 'rxjs';

/**
 * Respuesta de los endpoints internos /internal/users/:id/exists
 * y /internal/organizations/:id/exists
 */
interface ExistsResponse {
	exists: boolean;
}

/**
 * Respuesta del endpoint /internal/organizations/:orgId/members/:userId/exists
 */
interface MembershipResponse {
	isMember: boolean;
}

/**
 * Adaptador HTTP para validación externa contra el monolito.
 *
 * Valida usuarios y organizaciones llamando a los endpoints internos:
 * - GET /internal/users/:id/exists
 * - GET /internal/organizations/:id/exists
 *
 * Usa autenticación service-to-service con X-Service-Token header.
 */
@Injectable()
export class HttpExternalValidationAdapter extends ExternalValidationPort {
	private readonly logger = new Logger(HttpExternalValidationAdapter.name);
	private readonly monolithUrl: string;
	private readonly serviceToken: string;

	constructor(private readonly httpService: HttpService) {
		super();
		this.monolithUrl = process.env.MONOLITH_URL || 'http://localhost:3000';
		this.serviceToken = process.env.SERVICE_SECRET_KEY || '';

		if (!this.serviceToken) {
			this.logger.warn(
				'SERVICE_SECRET_KEY not configured - internal endpoint calls will fail',
			);
		}
	}

	/**
	 * Headers comunes para llamadas a endpoints internos.
	 */
	private getServiceHeaders() {
		return {
			'X-Service-Token': this.serviceToken,
		};
	}

	/**
	 * Valida si un usuario existe en el monolito.
	 * Usa GET /internal/users/:id/exists con autenticación por token de servicio.
	 */
	async validateUser(userId: string): Promise<boolean> {
		try {
			this.logger.debug(`Validating user ${userId} against monolith`);

			const response = await firstValueFrom(
				this.httpService.get<ExistsResponse>(
					`${this.monolithUrl}/internal/users/${userId}/exists`,
					{ headers: this.getServiceHeaders() },
				),
			);

			return response.data?.exists === true;
		} catch (error) {
			if (error.response?.status === 401) {
				this.logger.error(
					'Service token authentication failed - check SERVICE_SECRET_KEY',
				);
				throw new Error('Service authentication failed');
			}

			this.logger.error(`Error validating user ${userId}:`, error.message);
			throw new Error(`Failed to validate user: ${error.message}`);
		}
	}

	/**
	 * Valida si una organización existe en el monolito.
	 * Usa GET /internal/organizations/:id/exists con autenticación por token de servicio.
	 */
	async validateOrganization(organizationId: string): Promise<boolean> {
		try {
			this.logger.debug(
				`Validating organization ${organizationId} against monolith`,
			);

			const response = await firstValueFrom(
				this.httpService.get<ExistsResponse>(
					`${this.monolithUrl}/internal/organizations/${organizationId}/exists`,
					{ headers: this.getServiceHeaders() },
				),
			);

			return response.data?.exists === true;
		} catch (error) {
			if (error.response?.status === 401) {
				this.logger.error(
					'Service token authentication failed - check SERVICE_SECRET_KEY',
				);
				throw new Error('Service authentication failed');
			}

			this.logger.error(
				`Error validating organization ${organizationId}:`,
				error.message,
			);
			throw new Error(`Failed to validate organization: ${error.message}`);
		}
	}

	/**
	 * Valida si un usuario es miembro de una organización.
	 * Usa GET /internal/organizations/:orgId/members/:userId/exists.
	 */
	async validateMembership(
		userId: string,
		organizationId: string,
	): Promise<boolean> {
		try {
			this.logger.debug(
				`Validating membership for user ${userId} in organization ${organizationId}`,
			);

			const response = await firstValueFrom(
				this.httpService.get<MembershipResponse>(
					`${this.monolithUrl}/internal/organizations/${organizationId}/members/${userId}/exists`,
					{ headers: this.getServiceHeaders() },
				),
			);

			return response.data?.isMember === true;
		} catch (error) {
			if (error.response?.status === 401) {
				this.logger.error(
					'Service token authentication failed - check SERVICE_SECRET_KEY',
				);
				throw new Error('Service authentication failed');
			}

			this.logger.error(
				`Error validating membership for user ${userId} in org ${organizationId}:`,
				error.message,
			);
			throw new Error(`Failed to validate membership: ${error.message}`);
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
