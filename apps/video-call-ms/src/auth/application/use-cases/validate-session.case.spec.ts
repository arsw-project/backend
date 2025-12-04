import type { SessionUser } from '@auth/domain/entities/session-user.entity';
import { ExternalAuthPort } from '@auth/domain/ports/external-auth.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidSessionError } from '../errors/auth.errors';
import { ValidateSessionUseCase } from './validate-session.case';

describe('ValidateSessionUseCase', () => {
	let useCase: ValidateSessionUseCase;
	let externalAuth: ExternalAuthPort;

	const mockUser: SessionUser = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
		role: 'user',
	};

	beforeEach(() => {
		externalAuth = {
			validateSession: vi.fn(),
			validateMembership: vi.fn(),
		} as unknown as ExternalAuthPort;

		useCase = new ValidateSessionUseCase(externalAuth);
	});

	describe('execute', () => {
		it('should return user when session is valid', async () => {
			// Arrange
			vi.mocked(externalAuth.validateSession).mockResolvedValue(mockUser);

			// Act
			const result = await useCase.execute('valid-session-token');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockUser);
			}
			expect(externalAuth.validateSession).toHaveBeenCalledWith(
				'valid-session-token',
			);
			expect(externalAuth.validateSession).toHaveBeenCalledTimes(1);
		});

		it('should return error when session is invalid', async () => {
			// Arrange
			vi.mocked(externalAuth.validateSession).mockResolvedValue(null);

			// Act
			const result = await useCase.execute('invalid-token');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidSessionError);
				expect(result.error.code).toBe('INVALID_SESSION');
			}
		});

		it('should return error when session is expired', async () => {
			// Arrange
			vi.mocked(externalAuth.validateSession).mockResolvedValue(null);

			// Act
			const result = await useCase.execute('expired-token');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidSessionError);
				expect(result.error.message).toBe('Invalid or expired session');
			}
		});

		it('should handle external auth service errors', async () => {
			// Arrange
			const serviceError = new Error('External service unavailable');
			vi.mocked(externalAuth.validateSession).mockRejectedValue(serviceError);

			// Act & Assert
			await expect(useCase.execute('any-token')).rejects.toThrow(
				'External service unavailable',
			);
		});

		it('should call external auth with exact session token', async () => {
			// Arrange
			const specificToken = 'specific.session.token.value';
			vi.mocked(externalAuth.validateSession).mockResolvedValue(mockUser);

			// Act
			await useCase.execute(specificToken);

			// Assert
			expect(externalAuth.validateSession).toHaveBeenCalledWith(specificToken);
		});

		it('should return user with all properties', async () => {
			// Arrange
			const fullUser: SessionUser = {
				id: 'full-user-id',
				name: 'Full User Name',
				email: 'full@example.com',
				role: 'admin',
			};
			vi.mocked(externalAuth.validateSession).mockResolvedValue(fullUser);

			// Act
			const result = await useCase.execute('token');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.id).toBe('full-user-id');
				expect(result.value.name).toBe('Full User Name');
				expect(result.value.email).toBe('full@example.com');
				expect(result.value.role).toBe('admin');
			}
		});
	});
});
