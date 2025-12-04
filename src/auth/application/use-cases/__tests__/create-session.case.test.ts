import type { CryptoService } from '@auth/application/services/crypto.service';
import type { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import type { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import type { User } from '@users/domain/entities/user.entity';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSessionUseCase } from '../create-session.case';

describe('CreateSessionUseCase', () => {
	// Declare test subject and dependencies
	let createSessionUseCase: CreateSessionUseCase;
	let mockCryptoService: CryptoService;
	let mockSessionRepository: SessionRepository;
	let mockMembershipRepository: MembershipRepository;

	// Setup fresh instances before each test
	beforeEach(() => {
		// Create mock implementations
		mockCryptoService = {
			generateSecureRandomString: vi.fn(),
			hashSecret: vi.fn(),
			constantTimeEqual: vi.fn(),
			hashPassword: vi.fn(),
			verifyPassword: vi.fn(),
		} as unknown as CryptoService;

		mockSessionRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			deleteById: vi.fn(),
			deleteByUserEmail: vi.fn(),
		} as unknown as SessionRepository;

		mockMembershipRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByUserAndOrganization: vi.fn(),
			findByOrganization: vi.fn(),
			findByUser: vi.fn().mockResolvedValue([]),
			update: vi.fn(),
			delete: vi.fn(),
			deleteByOrganization: vi.fn(),
			countByOrganization: vi.fn(),
			countOwnersByOrganization: vi.fn(),
		} as unknown as MembershipRepository;

		// Instantiate test subject
		createSessionUseCase = new CreateSessionUseCase(
			mockCryptoService,
			mockSessionRepository,
			mockMembershipRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should successfully create session with valid local user', async () => {
			// Arrange: Setup test data and mocks
			const validUser: User = {
				id: 'user-123',
				name: 'John Doe',
				email: 'john@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date('2025-01-01T00:00:00Z'),
				updatedAt: new Date('2025-01-01T00:00:00Z'),
			};

			const mockMemberships = [
				{
					id: 'membership-1',
					userId: 'user-123',
					organizationId: 'org-1',
					role: 'member' as const,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			const mockId = 'session-id-123';
			const mockSecret = 'secret-456';
			const mockSecretHash = new Uint8Array([1, 2, 3, 4]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId) // First call for id
				.mockReturnValueOnce(mockSecret); // Second call for secret

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			vi.mocked(mockMembershipRepository.findByUser).mockResolvedValue(
				mockMemberships,
			);

			// Act: Execute the method under test
			const result = await createSessionUseCase.execute(validUser);

			// Assert: Verify outcomes
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeDefined();
				expect(result.value.id).toBe(mockId);
				expect(result.value.secretHash).toBe(mockSecretHash);
				expect(result.value.token).toBe(`${mockId}.${mockSecret}`);
				expect(result.value.user).toEqual({
					id: validUser.id,
					name: validUser.name,
					email: validUser.email,
					authProvider: validUser.authProvider,
					role: validUser.role,
					membership: {
						id: 'membership-1',
						organizationId: 'org-1',
						role: 'member',
					},
					createdAt: validUser.createdAt,
					updatedAt: validUser.updatedAt,
				});
				expect(result.value.createdAt).toBeInstanceOf(Date);
			}

			// Verify dependencies were called correctly
			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenCalledTimes(2);
			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenNthCalledWith(1, 24);
			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenNthCalledWith(2, 48);
			expect(mockCryptoService.hashSecret).toHaveBeenCalledWith(mockSecret);
			expect(mockCryptoService.hashSecret).toHaveBeenCalledTimes(1);
			expect(mockMembershipRepository.findByUser).toHaveBeenCalledWith(
				validUser.id,
			);
			expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
			expect(mockSessionRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: mockId,
					secretHash: mockSecretHash,
					user: {
						id: validUser.id,
						name: validUser.name,
						email: validUser.email,
						authProvider: validUser.authProvider,
						role: validUser.role,
						membership: {
							id: 'membership-1',
							organizationId: 'org-1',
							role: 'member',
						},
						createdAt: validUser.createdAt,
						updatedAt: validUser.updatedAt,
					},
				}),
			);
		});

		it('should successfully create session with valid Google user', async () => {
			// Arrange: Setup test data for Google auth provider
			const validGoogleUser: User = {
				id: 'user-456',
				name: 'Jane Smith',
				email: 'jane@gmail.com',
				password: '',
				authProvider: 'google',
				providerId: 'google-123456',
				role: 'user',
				createdAt: new Date('2025-02-01T00:00:00Z'),
				updatedAt: new Date('2025-02-01T00:00:00Z'),
			};

			const mockId = 'google-session-id';
			const mockSecret = 'google-secret';
			const mockSecretHash = new Uint8Array([5, 6, 7, 8]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			const result = await createSessionUseCase.execute(validGoogleUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.authProvider).toBe('google');
				expect(result.value.user.email).toBe('jane@gmail.com');
				expect(result.value.token).toBe(`${mockId}.${mockSecret}`);
			}

			expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should successfully create session with admin role user', async () => {
			// Arrange: Setup test data for admin user
			const adminUser: User = {
				id: 'admin-789',
				name: 'Admin User',
				email: 'admin@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'admin',
				createdAt: new Date('2025-03-01T00:00:00Z'),
				updatedAt: new Date('2025-03-01T00:00:00Z'),
			};

			const mockId = 'admin-session-id';
			const mockSecret = 'admin-secret';
			const mockSecretHash = new Uint8Array([9, 10, 11, 12]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			const result = await createSessionUseCase.execute(adminUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.role).toBe('admin');
				expect(result.value.user.email).toBe('admin@example.com');
			}

			expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should successfully create session with system role user', async () => {
			// Arrange: Setup test data for system user
			const systemUser: User = {
				id: 'system-999',
				name: 'System User',
				email: 'system@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'system',
				createdAt: new Date('2025-04-01T00:00:00Z'),
				updatedAt: new Date('2025-04-01T00:00:00Z'),
			};

			const mockId = 'system-session-id';
			const mockSecret = 'system-secret';
			const mockSecretHash = new Uint8Array([13, 14, 15, 16]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			const result = await createSessionUseCase.execute(systemUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.role).toBe('system');
				expect(result.value.user.email).toBe('system@example.com');
			}

			expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should generate unique token for each session', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-unique',
				name: 'Unique User',
				email: 'unique@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const firstId = 'first-id';
			const firstSecret = 'first-secret';
			const secondId = 'second-id';
			const secondSecret = 'second-secret';
			const mockSecretHash = new Uint8Array([1, 2, 3]);

			// First execution
			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(firstId)
				.mockReturnValueOnce(firstSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			const firstResult = await createSessionUseCase.execute(validUser);

			// Second execution
			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(secondId)
				.mockReturnValueOnce(secondSecret);

			const secondResult = await createSessionUseCase.execute(validUser);

			// Assert
			expect(firstResult.ok).toBe(true);
			expect(secondResult.ok).toBe(true);

			if (firstResult.ok && secondResult.ok) {
				expect(firstResult.value.token).toBe(`${firstId}.${firstSecret}`);
				expect(secondResult.value.token).toBe(`${secondId}.${secondSecret}`);
				expect(firstResult.value.token).not.toBe(secondResult.value.token);
			}

			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenCalledTimes(4);
			expect(mockSessionRepository.create).toHaveBeenCalledTimes(2);
		});

		it('should only include session user fields in session object', async () => {
			// Arrange: User with all fields including password and id
			const validUser: User = {
				id: 'user-with-password',
				name: 'Test User',
				email: 'test@example.com',
				password: 'secret-password-hash',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date('2025-01-15T00:00:00Z'),
				updatedAt: new Date('2025-01-15T00:00:00Z'),
			};

			const mockId = 'session-id';
			const mockSecret = 'session-secret';
			const mockSecretHash = new Uint8Array([1, 2, 3]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			const result = await createSessionUseCase.execute(validUser);

			// Assert: Verify password and providerId are NOT in session user, but id is included
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user).not.toHaveProperty('password');
				expect(result.value.user).not.toHaveProperty('providerId');
				expect(result.value.user).toHaveProperty('id');
				expect(result.value.user).toHaveProperty('name');
				expect(result.value.user).toHaveProperty('email');
				expect(result.value.user).toHaveProperty('authProvider');
				expect(result.value.user).toHaveProperty('role');
				expect(result.value.user).toHaveProperty('membership');
				expect(result.value.user).toHaveProperty('createdAt');
				expect(result.value.user).toHaveProperty('updatedAt');
			}
		});
	});

	describe('execute - error cases', () => {
		it('should throw error when user email is invalid', async () => {
			// Arrange: User with invalid email format
			const invalidUser = {
				id: 'user-invalid',
				name: 'Invalid User',
				email: 'not-an-email', // Invalid email format
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			} as User;

			const mockId = 'session-id';
			const mockSecret = 'session-secret';

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);

			// Act & Assert: Should throw error
			await expect(createSessionUseCase.execute(invalidUser)).rejects.toThrow(
				'Invalid user data for session',
			);

			// Verify repository was NOT called
			expect(mockSessionRepository.create).not.toHaveBeenCalled();
		});

		it('should throw error when user role is invalid', async () => {
			// Arrange: User with invalid role
			const invalidUser = {
				id: 'user-invalid-role',
				name: 'Invalid Role User',
				email: 'valid@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'superuser', // Invalid role (not user, admin, or system)
				createdAt: new Date(),
				updatedAt: new Date(),
			} as unknown as User;

			const mockId = 'session-id';
			const mockSecret = 'session-secret';

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);

			// Act & Assert
			await expect(createSessionUseCase.execute(invalidUser)).rejects.toThrow(
				'Invalid user data for session',
			);

			expect(mockSessionRepository.create).not.toHaveBeenCalled();
		});

		it('should throw error when user authProvider is invalid type', async () => {
			// Arrange: User with invalid authProvider type
			const invalidUser = {
				id: 'user-invalid-provider',
				name: 'Valid Name',
				email: 'valid@example.com',
				password: 'hashed-password',
				authProvider: 123, // Invalid: number instead of string
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			} as unknown as User;

			const mockId = 'session-id';
			const mockSecret = 'session-secret';

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);

			// Act & Assert
			await expect(createSessionUseCase.execute(invalidUser)).rejects.toThrow(
				'Invalid user data for session',
			);

			expect(mockSessionRepository.create).not.toHaveBeenCalled();
		});

		it('should throw error when user createdAt is not a Date', async () => {
			// Arrange: User with invalid createdAt
			const invalidUser = {
				id: 'user-invalid-date',
				name: 'Valid User',
				email: 'valid@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: 'not-a-date', // Invalid date type
				updatedAt: new Date(),
			} as unknown as User;

			const mockId = 'session-id';
			const mockSecret = 'session-secret';

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);

			// Act & Assert
			await expect(createSessionUseCase.execute(invalidUser)).rejects.toThrow(
				'Invalid user data for session',
			);

			expect(mockSessionRepository.create).not.toHaveBeenCalled();
		});

		it('should throw error when user updatedAt is not a Date', async () => {
			// Arrange: User with invalid updatedAt
			const invalidUser = {
				id: 'user-invalid-updated',
				name: 'Valid User',
				email: 'valid@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: 'not-a-date', // Invalid date type
			} as unknown as User;

			const mockId = 'session-id';
			const mockSecret = 'session-secret';

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(
				new Uint8Array([1, 2, 3]),
			);

			// Act & Assert
			await expect(createSessionUseCase.execute(invalidUser)).rejects.toThrow(
				'Invalid user data for session',
			);

			expect(mockSessionRepository.create).not.toHaveBeenCalled();
		});
	});

	describe('execute - edge cases', () => {
		it('should not mutate input user object', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-immutable',
				name: 'Immutable User',
				email: 'immutable@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date('2025-05-01T00:00:00Z'),
				updatedAt: new Date('2025-05-01T00:00:00Z'),
			};

			const originalUser = { ...validUser };

			const mockId = 'session-id';
			const mockSecret = 'session-secret';
			const mockSecretHash = new Uint8Array([1, 2, 3]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			await createSessionUseCase.execute(validUser);

			// Assert: Input should not be mutated
			expect(validUser).toEqual(originalUser);
		});

		it('should handle user with providerId as null for local auth', async () => {
			// Arrange: Local user with null providerId
			const localUser: User = {
				id: 'local-user',
				name: 'Local User',
				email: 'local@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null, // Explicitly null for local auth
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockId = 'session-id';
			const mockSecret = 'session-secret';
			const mockSecretHash = new Uint8Array([1, 2, 3]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			const result = await createSessionUseCase.execute(localUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.authProvider).toBe('local');
				// Session user should not include providerId
				expect(result.value.user).not.toHaveProperty('providerId');
			}

			expect(mockSessionRepository.create).toHaveBeenCalledTimes(1);
		});

		it('should create session with current timestamp', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-timestamp',
				name: 'Timestamp User',
				email: 'timestamp@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date('2025-01-01T00:00:00Z'),
				updatedAt: new Date('2025-01-01T00:00:00Z'),
			};

			const mockId = 'session-id';
			const mockSecret = 'session-secret';
			const mockSecretHash = new Uint8Array([1, 2, 3]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			const beforeExecution = new Date();

			// Act
			const result = await createSessionUseCase.execute(validUser);

			const afterExecution = new Date();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.createdAt).toBeInstanceOf(Date);
				// Session createdAt should be between before and after execution
				expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(
					beforeExecution.getTime(),
				);
				expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(
					afterExecution.getTime(),
				);
			}
		});

		it('should call hashSecret with the generated secret', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-hash-test',
				name: 'Hash Test User',
				email: 'hashtest@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockId = 'test-id';
			const mockSecret = 'test-secret-to-hash';
			const mockSecretHash = new Uint8Array([99, 100, 101]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			await createSessionUseCase.execute(validUser);

			// Assert: Verify hashSecret was called with the exact secret
			expect(mockCryptoService.hashSecret).toHaveBeenCalledWith(mockSecret);
			expect(mockCryptoService.hashSecret).toHaveBeenCalledTimes(1);
		});

		it('should create session with correct id length parameter', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-id-length',
				name: 'ID Length User',
				email: 'idlength@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockId = 'session-id-24-chars-long';
			const mockSecret = 'secret-48-chars-long';
			const mockSecretHash = new Uint8Array([1, 2, 3]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			await createSessionUseCase.execute(validUser);

			// Assert: Verify generateSecureRandomString called with correct lengths
			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenNthCalledWith(1, 24); // ID length
			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenNthCalledWith(2, 48); // Secret length
		});

		it('should store hashed secret in repository, not plain secret', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-hash-storage',
				name: 'Hash Storage User',
				email: 'hashstorage@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockId = 'session-id';
			const mockSecret = 'plain-secret';
			const mockSecretHash = new Uint8Array([10, 20, 30, 40]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			await createSessionUseCase.execute(validUser);

			// Assert: Verify repository stores hashed secret, not plain
			expect(mockSessionRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					secretHash: mockSecretHash,
				}),
			);

			// Verify the call does NOT contain the plain secret
			const createCall = vi.mocked(mockSessionRepository.create).mock
				.calls[0][0];
			expect(createCall.secretHash).toBe(mockSecretHash);
			expect(createCall).not.toHaveProperty('secret');
		});

		it('should include token in returned session but not store it', async () => {
			// Arrange
			const validUser: User = {
				id: 'user-token-test',
				name: 'Token Test User',
				email: 'tokentest@example.com',
				password: 'hashed-password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockId = 'id-123';
			const mockSecret = 'secret-456';
			const mockSecretHash = new Uint8Array([5, 10, 15]);

			vi.mocked(mockCryptoService.generateSecureRandomString)
				.mockReturnValueOnce(mockId)
				.mockReturnValueOnce(mockSecret);

			vi.mocked(mockCryptoService.hashSecret).mockResolvedValue(mockSecretHash);

			vi.mocked(mockSessionRepository.create).mockResolvedValue(undefined);

			// Act
			const result = await createSessionUseCase.execute(validUser);

			// Assert: Result should include token
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.token).toBe(`${mockId}.${mockSecret}`);
			}

			// Repository should NOT receive token
			const createCall = vi.mocked(mockSessionRepository.create).mock
				.calls[0][0];
			expect(createCall).not.toHaveProperty('token');
		});
	});
});
