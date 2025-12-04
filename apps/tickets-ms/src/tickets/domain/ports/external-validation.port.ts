/**
 * Puerto para validación externa de entidades del monolito.
 *
 * Este puerto define la interfaz para validar la existencia de usuarios
 * y organizaciones en el sistema principal (monolito).
 */
export abstract class ExternalValidationPort {
	/**
	 * Valida si un usuario existe en el monolito.
	 *
	 * Usa GET /internal/users/:id/exists.
	 *
	 * @param userId - UUID del usuario a validar
	 * @returns true si el usuario existe, false si no existe
	 * @throws Error si hay un problema de conexión con el monolito
	 */
	abstract validateUser(userId: string): Promise<boolean>;

	/**
	 * Valida si una organización existe en el monolito.
	 *
	 * Usa GET /internal/organizations/:id/exists.
	 *
	 * @param organizationId - UUID de la organización a validar
	 * @returns true si la organización existe, false si no existe
	 * @throws Error si hay un problema de conexión con el monolito
	 */
	abstract validateOrganization(organizationId: string): Promise<boolean>;

	/**
	 * Valida si un usuario es miembro de una organización.
	 *
	 * Usa GET /internal/organizations/:organizationId/members/:userId/exists.
	 *
	 * @param userId - UUID del usuario a validar
	 * @param organizationId - UUID de la organización
	 * @returns true si el usuario es miembro, false si no lo es
	 * @throws Error si hay un problema de conexión con el monolito
	 */
	abstract validateMembership(
		userId: string,
		organizationId: string,
	): Promise<boolean>;

	/**
	 * Valida tanto usuario como organización en una sola operación.
	 *
	 * @param userId - UUID del usuario a validar
	 * @param organizationId - UUID de la organización a validar
	 * @returns Objeto con el resultado de ambas validaciones
	 */
	abstract validateUserAndOrganization(
		userId: string,
		organizationId: string,
	): Promise<{
		userExists: boolean;
		organizationExists: boolean;
	}>;
}
