import {
	InvalidSecretError,
	MalformedTokenError,
	SessionNotFoundError,
} from '@auth/application/errors/session-integrity.error';
import { CryptoService } from '@auth/application/services/crypto.service';
import { Session } from '@auth/domain/entities/session.entity';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { SettingsClient } from '@settings/infrastructure/clients/settings.client';
import { SessionUserDto } from '@users/application/dto/session-user.dto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetSessionUseCase } from '../get-session.case';

describe('GetSessionUseCase', () => {
	let getSessionUseCase: GetSessionUseCase;
	let mockCryptoService: CryptoService;
	let mockSessionRepository: SessionRepository;
	let mockConfig: SettingsClient;

	const createMockConfig = (sessionExpiresInSeconds = 3600): SettingsClient => {
		return {
			sessionExpiresInSeconds,
			drizzleDatabaseUrl: 'test-url',
			googleClientId: 'test-id',
			googleClientSecret: 'test-secret',
			googleLoginRedirect: 'test-redirect',
			host: 'test-host',
			loggingConsoleEnabled: true,
			loggingFileEnabled: false,
			loggingFilePath: 'logs',
			loggingExternalEnabled: false,
			loggingExternalUrl: '',
		} as SettingsClient;
	};

	beforeEach(() => {
		// Create mock implementations
		mockCryptoService = {
			hashPassword: vi.fn(),
			verifyPassword: vi.fn(),
			generateSecureRandomString: vi.fn(),
			hashSecret: vi.fn(),
			constantTimeEqual: vi.fn(),
		} as unknown as CryptoService;

		mockSessionRepository = {
			findById: vi.fn(),
			deleteById: vi.fn(),
			create: vi.fn(),
		} as unknown as SessionRepository;

		mockConfig = createMockConfig();

		getSessionUseCase = new GetSessionUseCase(
			mockCryptoService,
			mockSessionRepository,
			mockConfig,
		);
	});

	describe('execute - success cases', () => {
		it('should successfully return session when token is valid and secret matches', async () => {
			// Arrange
			const sessionId = 'session-123';
			const sessionSecret = 'secret-abc';
			const sessionToken = `${sessionId}.${sessionSecret}`;

			const mockUser: SessionUserDto = {
				id: 'user-id',
				name: 'Test User',
				email: 'test@example.com',
				authProvider: 'local',
				role: 'user',
				memberships: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const secretHash = new Uint8Array([1, 2, 3, 4, 5]);
			const mockSession: Session = {
				id: sessionId,
				secretHash: secretHash,
				createdAt: new Date(Date.now() - 1000 * 60), // 1 minute ago
				user: mockUser,
			};

			const tokenSecretHash = new Uint8Array([1, 2, 3, 4, 5]);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				tokenSecretHash,
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockSession);
				expect(result.value.id).toBe(sessionId);
				expect(result.value.user.email).toBe('test@example.com');
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
			expect(mockCryptoService.hashSecret).toHaveBeenCalledWith(sessionSecret);
			expect(mockCryptoService.constantTimeEqual).toHaveBeenCalledWith(
				tokenSecretHash,
				secretHash,
			);
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should handle session with different user roles', async () => {
			// Arrange
			const sessionToken = 'session-456.secret-def';

			const mockUser: SessionUserDto = {
				id: 'user-id',
				name: 'Admin User',
				email: 'admin@example.com',
				authProvider: 'google',
				role: 'admin',
				memberships: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: Session = {
				id: 'session-456',
				secretHash: new Uint8Array([6, 7, 8]),
				createdAt: new Date(Date.now() - 500 * 1000), // 500 seconds ago
				user: mockUser,
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([6, 7, 8]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.role).toBe('admin');
			}
		});
	});

	describe('execute - error cases', () => {
		it('should return MalformedTokenError when token has no dot separator', async () => {
			// Arrange
			const malformedToken = 'session-123-secret-abc';

			// Act
			const result = await getSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
				expect(result.error.message).toBe('Malformed token');
			}

			expect(mockSessionRepository.findById).not.toHaveBeenCalled();
			expect(mockCryptoService.hashSecret).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token has more than 2 parts', async () => {
			// Arrange
			const malformedToken = 'session-123.secret-abc.extra-part';

			// Act
			const result = await getSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
			}

			expect(mockSessionRepository.findById).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token has only one part', async () => {
			// Arrange
			const malformedToken = 'only-one-part';

			// Act
			const result = await getSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
			}
		});

		it('should return SessionNotFoundError when token has empty parts (. splits into 2 empty strings)', async () => {
			// Arrange
			const malformedToken = '.';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			const result = await getSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				// Token "." splits into ["", ""] which has length 2, so it passes the malformed check
				// But then sessionId is "", which results in session not found
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith('');
		});
		it('should return SessionNotFoundError when session does not exist in repository', async () => {
			// Arrange
			const sessionToken = 'nonexistent-session.secret-xyz';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
				expect(result.error.code).toBe('SESSION_NOT_FOUND');
				expect(result.error.message).toBe('Session not found');
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'nonexistent-session',
			);
			expect(mockCryptoService.hashSecret).not.toHaveBeenCalled();
			expect(mockCryptoService.constantTimeEqual).not.toHaveBeenCalled();
		});

		it('should return SessionNotFoundError when session is expired', async () => {
			// Arrange
			const sessionToken = 'expired-session.secret-123';

			const expiredSession: Session = {
				id: 'expired-session',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			// Create use case with 1 hour expiration
			const configWithExpiration = createMockConfig(3600); // 1 hour
			const useCase = new GetSessionUseCase(
				mockCryptoService,
				mockSessionRepository,
				configWithExpiration,
			);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(
				expiredSession,
			);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'expired-session',
			);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'expired-session',
			);
			expect(mockCryptoService.hashSecret).not.toHaveBeenCalled();
		});
		it('should return InvalidSecretError when secret hash does not match', async () => {
			// Arrange
			const sessionToken = 'session-789.wrong-secret';

			const mockSession: Session = {
				id: 'session-789',
				secretHash: new Uint8Array([1, 2, 3, 4, 5]),
				createdAt: new Date(Date.now() - 100 * 1000), // 100 seconds ago
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			const wrongSecretHash = new Uint8Array([9, 8, 7, 6, 5]);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				wrongSecretHash,
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(false);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidSecretError);
				expect(result.error.message).toBe('Invalid secret');
			}

			expect(mockCryptoService.hashSecret).toHaveBeenCalledWith('wrong-secret');
			expect(mockCryptoService.constantTimeEqual).toHaveBeenCalledWith(
				wrongSecretHash,
				mockSession.secretHash,
			);
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});
	});

	describe('execute - edge cases', () => {
		it('should handle token with empty sessionId part', async () => {
			// Arrange
			const tokenWithEmptyId = '.secret-abc';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			const result = await getSessionUseCase.execute(tokenWithEmptyId);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith('');
		});

		it('should handle token with empty secret part', async () => {
			// Arrange
			const sessionToken = 'session-123.';

			const mockSession: Session = {
				id: 'session-123',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(Date.now() - 100 * 1000),
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(false);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidSecretError);
			}

			expect(mockCryptoService.hashSecret).toHaveBeenCalledWith('');
		});

		it('should handle session that expires exactly at the boundary', async () => {
			// Arrange
			const sessionToken = 'session-boundary.secret-boundary';
			const now = Date.now();
			const createdAt = new Date(now - 3600 * 1000); // Exactly 1 hour ago

			const mockSession: Session = {
				id: 'session-boundary',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: createdAt,
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			// Create use case with 1 hour expiration
			const configWithExpiration = createMockConfig(3600);
			const useCase = new GetSessionUseCase(
				mockCryptoService,
				mockSessionRepository,
				configWithExpiration,
			);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'session-boundary',
			);
		});
		it('should handle session that is just before expiration boundary', async () => {
			// Arrange
			const sessionToken = 'session-almost-expired.secret-xyz';
			const now = Date.now();
			const createdAt = new Date(now - 3599 * 1000); // 3599 seconds ago (1 second before expiry)

			const mockSession: Session = {
				id: 'session-almost-expired',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: createdAt,
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			// Create use case with 1 hour expiration
			const configWithExpiration = createMockConfig(3600);
			const useCase = new GetSessionUseCase(
				mockCryptoService,
				mockSessionRepository,
				configWithExpiration,
			);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await useCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.id).toBe('session-almost-expired');
			}

			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});
		it('should handle very short expiration time', async () => {
			// Arrange
			const sessionToken = 'session-short.secret-short';
			const now = Date.now();
			const createdAt = new Date(now - 61 * 1000); // 61 seconds ago

			const mockSession: Session = {
				id: 'session-short',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: createdAt,
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			// Create use case with 1 minute expiration
			const configWithExpiration = createMockConfig(60); // 1 minute
			const useCase = new GetSessionUseCase(
				mockCryptoService,
				mockSessionRepository,
				configWithExpiration,
			);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'session-short',
			);
		});
		it('should handle very long expiration time', async () => {
			// Arrange
			const sessionToken = 'session-long.secret-long';
			const now = Date.now();
			const createdAt = new Date(now - 86000 * 1000); // ~24 hours ago

			const mockSession: Session = {
				id: 'session-long',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: createdAt,
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			// Create use case with 7 days expiration
			const configWithExpiration = createMockConfig(604800); // 7 days
			const useCase = new GetSessionUseCase(
				mockCryptoService,
				mockSessionRepository,
				configWithExpiration,
			);

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await useCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.id).toBe('session-long');
			}

			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});
		it('should handle token with special characters in parts', async () => {
			// Arrange
			const sessionToken = 'session-!@#$%^&*().secret-!@#$%^&*()';

			const mockSession: Session = {
				id: 'session-!@#$%^&*()',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(Date.now() - 100 * 1000),
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.id).toBe('session-!@#$%^&*()');
			}

			expect(mockCryptoService.hashSecret).toHaveBeenCalledWith(
				'secret-!@#$%^&*()',
			);
		});

		it('should handle multiple dots in token (takes only first split)', async () => {
			// Arrange
			const tokenWithMultipleDots = 'session.123.secret.abc.extra';

			// Act
			const result = await getSessionUseCase.execute(tokenWithMultipleDots);

			// Assert - should fail because split('.') creates more than 2 parts
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
			}
		});
	});

	describe('getSession - integration with execute', () => {
		it('should call getSession method which handles expiration check', async () => {
			// Arrange
			const sessionToken = 'session-abc.secret-def';

			const mockSession: Session = {
				id: 'session-abc',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(Date.now() - 100 * 1000),
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert - verifies getSession was called as part of execute flow
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'session-abc',
			);
		});

		it('should handle freshly created session (just created)', async () => {
			// Arrange
			const sessionToken = 'session-fresh.secret-fresh';
			const now = new Date();

			const mockSession: Session = {
				id: 'session-fresh',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: now,
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			const result = await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});
	});

	describe('execute - immutability tests', () => {
		it('should not modify the session object retrieved from repository', async () => {
			// Arrange
			const sessionToken = 'session-immutable.secret-immutable';

			const originalSecretHash = new Uint8Array([1, 2, 3, 4, 5]);
			const mockSession: Session = {
				id: 'session-immutable',
				secretHash: originalSecretHash,
				createdAt: new Date(Date.now() - 100 * 1000),
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			const originalSession = { ...mockSession };

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3, 4, 5]),
			);
			vi.mocked(mockCryptoService.constantTimeEqual).mockReturnValue(true);

			// Act
			await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(mockSession.id).toBe(originalSession.id);
			expect(mockSession.secretHash).toBe(originalSecretHash);
		});
	});

	describe('execute - verification of method call order', () => {
		it('should verify methods are called in correct order for successful flow', async () => {
			// Arrange
			const sessionToken = 'session-order.secret-order';
			const callOrder: string[] = [];

			const mockSession: Session = {
				id: 'session-order',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(Date.now() - 100 * 1000),
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockImplementation(async () => {
				callOrder.push('findById');
				return mockSession;
			});

			vi.mocked(mockCryptoService.hashSecret).mockImplementation(async () => {
				callOrder.push('hashSecret');
				return new Uint8Array([1, 2, 3]);
			});

			vi.mocked(mockCryptoService.constantTimeEqual).mockImplementation(() => {
				callOrder.push('constantTimeEqual');
				return true;
			});

			// Act
			await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(callOrder).toEqual([
				'findById',
				'hashSecret',
				'constantTimeEqual',
			]);
		});

		it('should not call hashSecret or constantTimeEqual when session not found', async () => {
			// Arrange
			const sessionToken = 'nonexistent.secret';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(mockSessionRepository.findById).toHaveBeenCalled();
			expect(mockCryptoService.hashSecret).not.toHaveBeenCalled();
			expect(mockCryptoService.constantTimeEqual).not.toHaveBeenCalled();
		});

		it('should not call constantTimeEqual when session is expired', async () => {
			// Arrange
			const sessionToken = 'expired.secret';

			const expiredSession: Session = {
				id: 'expired',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(Date.now() - 7200 * 1000),
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(
				expiredSession,
			);

			// Act
			await getSessionUseCase.execute(sessionToken);

			// Assert
			expect(mockSessionRepository.findById).toHaveBeenCalled();
			expect(mockSessionRepository.deleteById).toHaveBeenCalled();
			expect(mockCryptoService.hashSecret).not.toHaveBeenCalled();
			expect(mockCryptoService.constantTimeEqual).not.toHaveBeenCalled();
		});
	});
});
