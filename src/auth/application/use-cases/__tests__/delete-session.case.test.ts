import {
	MalformedTokenError,
	SessionNotFoundError,
} from '@auth/application/errors/session-integrity.error';
import type { Session } from '@auth/domain/entities/session.entity';
import type { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteSessionUseCase } from '../delete-session.case';

describe('DeleteSessionUseCase', () => {
	// Declare test subject and dependencies
	let deleteSessionUseCase: DeleteSessionUseCase;
	let mockSessionRepository: SessionRepository;

	// Setup fresh instances before each test
	beforeEach(() => {
		// Create mock implementations
		mockSessionRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			deleteById: vi.fn(),
			deleteByUserEmail: vi.fn(),
		} as unknown as SessionRepository;

		// Instantiate test subject
		deleteSessionUseCase = new DeleteSessionUseCase(mockSessionRepository);
	});

	describe('execute - success cases', () => {
		it('should successfully delete session with valid token format', async () => {
			// Arrange: Setup test data and mocks
			const validToken = 'session-id-123.secret-456';
			const mockSession: Session = {
				id: 'session-id-123',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-01T00:00:00Z'),
				user: {
					id: 'user-id',
					name: 'John Doe',
					email: 'john@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01T00:00:00Z'),
					updatedAt: new Date('2025-01-01T00:00:00Z'),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act: Execute the method under test
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert: Verify outcomes
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeUndefined();
			}

			// Verify dependencies were called correctly
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'session-id-123',
			);
			expect(mockSessionRepository.findById).toHaveBeenCalledTimes(1);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'session-id-123',
			);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledTimes(1);
		});

		it('should successfully delete session with different valid token', async () => {
			// Arrange: Test with different session ID and secret
			const validToken = 'different-session.different-secret';
			const mockSession: Session = {
				id: 'different-session',
				secretHash: new Uint8Array([5, 6, 7, 8]),
				createdAt: new Date('2025-02-01T00:00:00Z'),
				user: {
					id: 'user-id',
					name: 'Jane Smith',
					email: 'jane@example.com',
					authProvider: 'google',
					role: 'admin',
					memberships: [],
					createdAt: new Date('2025-02-01T00:00:00Z'),
					updatedAt: new Date('2025-02-01T00:00:00Z'),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'different-session',
			);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'different-session',
			);
		});

		it('should handle session with hyphenated ID', async () => {
			// Arrange: Session ID with hyphens
			const sessionId = 'session-with-many-hyphens-123';
			const validToken = `${sessionId}.secret-456`;
			const mockSession: Session = {
				id: sessionId,
				secretHash: new Uint8Array([9, 10, 11, 12]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'User',
					email: 'user@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(sessionId);
		});

		it('should handle session with long ID and secret', async () => {
			// Arrange: Token with very long ID and secret
			const longId =
				'very-long-session-id-with-many-characters-0123456789abcdef';
			const longSecret =
				'very-long-secret-with-many-characters-and-special-chars-!@#$%';
			const validToken = `${longId}.${longSecret}`;
			const mockSession: Session = {
				id: longId,
				secretHash: new Uint8Array([13, 14, 15, 16]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Long ID User',
					email: 'long@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(longId);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(longId);
		});
	});

	describe('execute - error cases', () => {
		it('should return MalformedTokenError when token has no dots', async () => {
			// Arrange: Token without dot separator
			const malformedToken = 'session-id-without-dot';

			// Act
			const result = await deleteSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
				expect(result.error.message).toBe('Malformed token');
			}

			// Verify repository methods were NOT called
			expect(mockSessionRepository.findById).not.toHaveBeenCalled();
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token is empty string', async () => {
			// Arrange: Empty token
			const malformedToken = '';

			// Act
			const result = await deleteSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
				expect(result.error.message).toBe('Malformed token');
			}

			expect(mockSessionRepository.findById).not.toHaveBeenCalled();
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token has only one part before dot', async () => {
			// Arrange: Token with only ID part (no secret after dot)
			const malformedToken = 'session-id.';

			// Act
			const result = await deleteSessionUseCase.execute(malformedToken);

			// Assert: Split will produce ['session-id', ''], length = 2, but this is still valid format
			// This test verifies the behavior with empty secret part
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			// findById should be called since token format is valid (2 parts)
			expect(mockSessionRepository.findById).toHaveBeenCalledWith('session-id');
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token has only dot', async () => {
			// Arrange: Token with only dot
			const malformedToken = '.';

			// Act
			const result = await deleteSessionUseCase.execute(malformedToken);

			// Assert: Split will produce ['', ''], length = 2, so format is valid
			// This will fail at findById with empty string ID
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith('');
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token has more than one dot', async () => {
			// Arrange: Token with multiple dots (more than 2 parts)
			const malformedToken = 'session-id.secret.extra-part';

			// Act
			const result = await deleteSessionUseCase.execute(malformedToken);

			// Assert: Split will produce 3 parts, should fail malformed token check
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
				expect(result.error.message).toBe('Malformed token');
			}

			expect(mockSessionRepository.findById).not.toHaveBeenCalled();
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return MalformedTokenError when token has three dots', async () => {
			// Arrange: Token with three dots (4 parts)
			const malformedToken = 'part1.part2.part3.part4';

			// Act
			const result = await deleteSessionUseCase.execute(malformedToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MalformedTokenError);
				expect(result.error.message).toBe('Malformed token');
			}

			expect(mockSessionRepository.findById).not.toHaveBeenCalled();
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return SessionNotFoundError when session does not exist', async () => {
			// Arrange: Valid token format but session not in database
			const validToken = 'non-existent-session.secret-123';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
				expect(result.error.code).toBe('SESSION_NOT_FOUND');
				expect(result.error.message).toBe('Session not found');
			}

			// Verify findById was called but deleteById was NOT
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'non-existent-session',
			);
			expect(mockSessionRepository.findById).toHaveBeenCalledTimes(1);
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return SessionNotFoundError when session was already deleted', async () => {
			// Arrange: Token for previously deleted session
			const validToken = 'deleted-session.old-secret';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'deleted-session',
			);
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});

		it('should return SessionNotFoundError for different non-existent session', async () => {
			// Arrange: Another non-existent session to verify consistent behavior
			const validToken = 'another-non-existent.secret-abc';

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(null);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(SessionNotFoundError);
				expect(result.error.code).toBe('SESSION_NOT_FOUND');
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'another-non-existent',
			);
			expect(mockSessionRepository.deleteById).not.toHaveBeenCalled();
		});
	});

	describe('execute - edge cases', () => {
		it('should handle token with special characters in session ID', async () => {
			// Arrange: Session ID with special characters
			const specialId = 'session-!@#$%^&*()';
			const validToken = `${specialId}.secret-normal`;
			const mockSession: Session = {
				id: specialId,
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Special User',
					email: 'special@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(specialId);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(specialId);
		});

		it('should handle token with unicode characters', async () => {
			// Arrange: Token with unicode characters
			const unicodeId = 'session-你好-🔒';
			const validToken = `${unicodeId}.secret-🔑`;
			const mockSession: Session = {
				id: unicodeId,
				secretHash: new Uint8Array([4, 5, 6]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Unicode User',
					email: 'unicode@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(unicodeId);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(unicodeId);
		});

		it('should handle concurrent deletion attempts for same session', async () => {
			// Arrange: Same token used twice
			const validToken = 'concurrent-session.secret-123';
			const mockSession: Session = {
				id: 'concurrent-session',
				secretHash: new Uint8Array([7, 8, 9]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Concurrent User',
					email: 'concurrent@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			// First call finds session, second call returns null (already deleted)
			vi.mocked(mockSessionRepository.findById)
				.mockResolvedValueOnce(mockSession)
				.mockResolvedValueOnce(null);

			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act: First deletion
			const firstResult = await deleteSessionUseCase.execute(validToken);

			// Act: Second deletion (session already deleted)
			const secondResult = await deleteSessionUseCase.execute(validToken);

			// Assert: First should succeed
			expect(firstResult.ok).toBe(true);

			// Assert: Second should fail with SessionNotFoundError
			expect(secondResult.ok).toBe(false);
			if (!secondResult.ok) {
				expect(secondResult.error).toBeInstanceOf(SessionNotFoundError);
			}

			expect(mockSessionRepository.findById).toHaveBeenCalledTimes(2);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledTimes(1);
		});

		it('should not mutate input token parameter', async () => {
			// Arrange
			const originalToken = 'immutable-session.immutable-secret';
			const tokenCopy = originalToken;
			const mockSession: Session = {
				id: 'immutable-session',
				secretHash: new Uint8Array([10, 11, 12]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Immutable User',
					email: 'immutable@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			await deleteSessionUseCase.execute(tokenCopy);

			// Assert: Input should not be mutated
			expect(tokenCopy).toBe(originalToken);
		});

		it('should handle token with whitespace characters', async () => {
			// Arrange: Token with spaces (treated as part of ID/secret)
			const tokenWithSpaces = 'session with spaces.secret with spaces';
			const mockSession: Session = {
				id: 'session with spaces',
				secretHash: new Uint8Array([13, 14, 15]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Whitespace User',
					email: 'whitespace@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(tokenWithSpaces);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(
				'session with spaces',
			);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'session with spaces',
			);
		});

		it('should only call deleteById after successful findById', async () => {
			// Arrange: Verify order of operations
			const validToken = 'order-test-session.order-test-secret';
			const mockSession: Session = {
				id: 'order-test-session',
				secretHash: new Uint8Array([16, 17, 18]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Order Test User',
					email: 'order@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			const callOrder: string[] = [];

			vi.mocked(mockSessionRepository.findById).mockImplementation(async () => {
				callOrder.push('findById');
				return mockSession;
			});

			vi.mocked(mockSessionRepository.deleteById).mockImplementation(
				async () => {
					callOrder.push('deleteById');
					return undefined;
				},
			);

			// Act
			await deleteSessionUseCase.execute(validToken);

			// Assert: findById should be called before deleteById
			expect(callOrder).toEqual(['findById', 'deleteById']);
		});

		it('should handle session with minimum required fields', async () => {
			// Arrange: Session with only required fields
			const validToken = 'minimal-session.minimal-secret';
			const mockSession: Session = {
				id: 'minimal-session',
				secretHash: new Uint8Array([19, 20, 21]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Minimal',
					email: 'minimal@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'minimal-session',
			);
		});

		it('should handle session with different auth providers', async () => {
			// Arrange: Session for Google auth user
			const validToken = 'google-session.google-secret';
			const mockSession: Session = {
				id: 'google-session',
				secretHash: new Uint8Array([22, 23, 24]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Google User',
					email: 'google@gmail.com',
					authProvider: 'google',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert: Should delete regardless of auth provider
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'google-session',
			);
		});

		it('should handle session with admin role', async () => {
			// Arrange: Session for admin user
			const validToken = 'admin-session.admin-secret';
			const mockSession: Session = {
				id: 'admin-session',
				secretHash: new Uint8Array([25, 26, 27]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Admin User',
					email: 'admin@example.com',
					authProvider: 'local',
					role: 'admin',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert: Should delete regardless of user role
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'admin-session',
			);
		});

		it('should handle session with system role', async () => {
			// Arrange: Session for system user
			const validToken = 'system-session.system-secret';
			const mockSession: Session = {
				id: 'system-session',
				secretHash: new Uint8Array([28, 29, 30]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'System User',
					email: 'system@example.com',
					authProvider: 'local',
					role: 'system',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert: Should delete regardless of user role
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(
				'system-session',
			);
		});

		it('should correctly split token and extract only first part as session ID', async () => {
			// Arrange: Verify that only the first part before first dot is used as ID
			const sessionId = 'first-part';
			const secretPart = 'second-part';
			const validToken = `${sessionId}.${secretPart}`;
			const mockSession: Session = {
				id: sessionId,
				secretHash: new Uint8Array([31, 32, 33]),
				createdAt: new Date(),
				user: {
					id: 'user-id',
					name: 'Split Test User',
					email: 'split@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession);
			vi.mocked(mockSessionRepository.deleteById).mockResolvedValue(undefined);

			// Act
			const result = await deleteSessionUseCase.execute(validToken);

			// Assert: Should extract correct session ID
			expect(result.ok).toBe(true);
			expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId);
			expect(mockSessionRepository.findById).not.toHaveBeenCalledWith(
				secretPart,
			);
			expect(mockSessionRepository.deleteById).toHaveBeenCalledWith(sessionId);
		});
	});
});
