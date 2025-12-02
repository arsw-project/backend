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
	 * IMPLEMENTACIÓN ACTUAL: Usa GET /users y filtra por ID (ineficiente).
	 *
	 * TODO: Cuando se implemente GET /users/:id en el monolito, cambiar a:
	 * ```typescript
	 * // En HttpExternalValidationAdapter:
	 * async validateUser(userId: string): Promise<boolean> {
	 *   try {
	 *     const response = await firstValueFrom(
	 *       this.httpService.get(`${this.monolithUrl}/users/${userId}`)
	 *     );
	 *     return response.status === 200 && response.data?.user != null;
	 *   } catch (error) {
	 *     if (error.response?.status === 404) return false;
	 *     throw error;
	 *   }
	 * }
	 * ```
	 *
	 * @param userId - UUID del usuario a validar
	 * @returns true si el usuario existe, false si no existe
	 * @throws Error si hay un problema de conexión con el monolito
	 */
	abstract validateUser(userId: string): Promise<boolean>;

	/**
	 * Valida si una organización existe en el monolito.
	 *
	 * Usa GET /organizations/:id directamente.
	 *
	 * @param organizationId - UUID de la organización a validar
	 * @returns true si la organización existe, false si no existe
	 * @throws Error si hay un problema de conexión con el monolito
	 */
	abstract validateOrganization(organizationId: string): Promise<boolean>;

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
