import type { CryptoService } from '@auth/application/services/crypto.service';
import type { CreateSessionUseCase } from '@auth/application/use-cases/create-session.case';
import type { SessionWithToken } from '@auth/domain/entities/session.entity';
import { ok } from '@common/utility/results';
import type { User } from '@users/domain/entities/user.entity';
import type { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginGoogleUserUseCase } from '../login-google-user.case';

describe('LoginGoogleUserUseCase', () => {
	// Declare test subject and dependencies
	let loginGoogleUserUseCase: LoginGoogleUserUseCase;
	let mockCryptoService: CryptoService;
	let mockUserRepository: UserRepository;
	let mockCreateSessionUseCase: CreateSessionUseCase;

	// Setup fresh instances before each test
	beforeEach(() => {
		// Create mock implementations
		mockCryptoService = {
			generateSecureRandomString: vi.fn(),
			hashPassword: vi.fn(),
			verifyPassword: vi.fn(),
			hashSecret: vi.fn(),
			constantTimeEqual: vi.fn(),
		} as unknown as CryptoService;

		mockUserRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByEmail: vi.fn(),
			findByProviderId: vi.fn(),
			checkUserConflict: vi.fn(),
			findAll: vi.fn(),
		} as unknown as UserRepository;

		mockCreateSessionUseCase = {
			execute: vi.fn(),
		} as unknown as CreateSessionUseCase;

		// Instantiate test subject
		loginGoogleUserUseCase = new LoginGoogleUserUseCase(
			mockCryptoService,
			mockUserRepository,
			mockCreateSessionUseCase,
		);
	});

	describe('execute - success cases', () => {
		it('should successfully login existing Google user', async () => {
			// Arrange: Setup test data for existing Google user
			const input = {
				name: 'John Doe',
				email: 'john.doe@gmail.com',
				googleUserId: 'google-123456',
			};

			const existingUser: User = {
				id: 'user-existing-123',
				name: 'John Doe',
				email: 'john.doe@gmail.com',
				password: 'hashed-random-password',
				authProvider: 'google',
				providerId: 'google-123456',
				role: 'user',
				createdAt: new Date('2025-01-01T00:00:00Z'),
				updatedAt: new Date('2025-01-01T00:00:00Z'),
			};

			const mockSession: SessionWithToken = {
				id: 'session-123',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date(),
				token: 'session-token-abc',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			const mockRandomString = 'random-string-123';
			const mockHashedPassword = 'hashed-random-password-abc';

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				mockRandomString,
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				mockHashedPassword,
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act: Execute the method under test
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert: Verify outcomes
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockSession);
				expect(result.value.token).toBe('session-token-abc');
				expect(result.value.user.email).toBe('john.doe@gmail.com');
			}

			// Verify dependencies were called correctly
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledWith(
				'google',
				'google-123456',
			);
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledTimes(1);

			expect(mockCryptoService.generateSecureRandomString).toHaveBeenCalledWith(
				12,
			);
			expect(
				mockCryptoService.generateSecureRandomString,
			).toHaveBeenCalledTimes(1);

			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				mockRandomString,
			);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledTimes(1);

			// User should NOT be created for existing user
			expect(mockUserRepository.create).not.toHaveBeenCalled();

			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(
				existingUser,
			);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledTimes(1);
		});

		it('should successfully register and login new Google user when user does not exist', async () => {
			// Arrange: Setup test data for new Google user
			const input = {
				name: 'Jane Smith',
				email: 'jane.smith@gmail.com',
				googleUserId: 'google-789012',
			};

			const mockRandomString = 'secure-random-string';
			const mockHashedPassword = 'hashed-secure-password';

			const newUser: User = {
				id: 'user-new-456',
				name: 'Jane Smith',
				email: 'jane.smith@gmail.com',
				password: mockHashedPassword,
				authProvider: 'google',
				providerId: 'google-789012',
				role: 'user',
				createdAt: new Date('2025-02-01T00:00:00Z'),
				updatedAt: new Date('2025-02-01T00:00:00Z'),
			};

			const mockSession: SessionWithToken = {
				id: 'session-456',
				secretHash: new Uint8Array([5, 6, 7, 8]),
				createdAt: new Date(),
				token: 'session-token-xyz',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			// User does not exist
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				mockRandomString,
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				mockHashedPassword,
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockSession);
				expect(result.value.token).toBe('session-token-xyz');
				expect(result.value.user.email).toBe('jane.smith@gmail.com');
			}

			// Verify user lookup
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledWith(
				'google',
				'google-789012',
			);
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledTimes(1);

			// Verify random password generation
			expect(mockCryptoService.generateSecureRandomString).toHaveBeenCalledWith(
				12,
			);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				mockRandomString,
			);

			// Verify new user creation
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				name: 'Jane Smith',
				email: 'jane.smith@gmail.com',
				password: mockHashedPassword,
				authProvider: 'google',
				providerId: 'google-789012',
			});
			expect(mockUserRepository.create).toHaveBeenCalledTimes(1);

			// Verify session creation with new user
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(newUser);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledTimes(1);
		});

		it('should generate random password for every login attempt', async () => {
			// Arrange: Test that random password is generated each time
			const input = {
				name: 'Test User',
				email: 'test@gmail.com',
				googleUserId: 'google-test-123',
			};

			const existingUser: User = {
				id: 'user-test',
				name: 'Test User',
				email: 'test@gmail.com',
				password: 'old-hashed-password',
				authProvider: 'google',
				providerId: 'google-test-123',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-test',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify random password generation always occurs
			expect(mockCryptoService.generateSecureRandomString).toHaveBeenCalledWith(
				12,
			);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				'random-string',
			);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledTimes(1);
		});

		it('should handle multiple login attempts for same Google user', async () => {
			// Arrange: Test idempotency
			const input = {
				name: 'Repeat User',
				email: 'repeat@gmail.com',
				googleUserId: 'google-repeat-123',
			};

			const existingUser: User = {
				id: 'user-repeat',
				name: 'Repeat User',
				email: 'repeat@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-repeat-123',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession1: SessionWithToken = {
				id: 'session-1',
				secretHash: new Uint8Array([1]),
				createdAt: new Date(),
				token: 'token-1',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			const mockSession2: SessionWithToken = {
				id: 'session-2',
				secretHash: new Uint8Array([2]),
				createdAt: new Date(),
				token: 'token-2',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);

			vi.mocked(mockCreateSessionUseCase.execute)
				.mockResolvedValueOnce(ok(mockSession1))
				.mockResolvedValueOnce(ok(mockSession2));

			// Act: Execute twice
			const result1 = await loginGoogleUserUseCase.execute(input);
			const result2 = await loginGoogleUserUseCase.execute(input);

			// Assert: Both should succeed with different sessions
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);

			if (result1.ok && result2.ok) {
				expect(result1.value.token).toBe('token-1');
				expect(result2.value.token).toBe('token-2');
			}

			expect(mockUserRepository.findByProviderId).toHaveBeenCalledTimes(2);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledTimes(2);
			// Should NOT create user on second login
			expect(mockUserRepository.create).not.toHaveBeenCalled();
		});

		it('should successfully login Google user with different name than registered', async () => {
			// Arrange: User updates name in Google account
			const input = {
				name: 'Updated Name',
				email: 'user@gmail.com',
				googleUserId: 'google-update-123',
			};

			const existingUser: User = {
				id: 'user-update',
				name: 'Original Name', // Different from input
				email: 'user@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-update-123',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-update',
				secretHash: new Uint8Array([1, 2]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert: Should use existing user data, not input name
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.name).toBe('Original Name');
			}

			expect(mockUserRepository.create).not.toHaveBeenCalled();
		});
	});

	describe('execute - edge cases', () => {
		it('should not mutate input parameters', async () => {
			// Arrange
			const input = {
				name: 'Immutable User',
				email: 'immutable@gmail.com',
				googleUserId: 'google-immutable-123',
			};

			const originalInput = { ...input };

			const existingUser: User = {
				id: 'user-immutable',
				name: 'Immutable User',
				email: 'immutable@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-immutable-123',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-immutable',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Input should not be mutated
			expect(input).toEqual(originalInput);
		});

		it('should handle empty name when creating new Google user', async () => {
			// Arrange: Edge case with empty name
			const input = {
				name: '',
				email: 'empty-name@gmail.com',
				googleUserId: 'google-empty-name',
			};

			const newUser: User = {
				id: 'user-empty-name',
				name: '',
				email: 'empty-name@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-empty-name',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-empty-name',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: '',
				}),
			);
		});

		it('should handle special characters in name', async () => {
			// Arrange: Edge case with special characters
			const input = {
				name: "O'Brien-Smith (Jr.) & Co.",
				email: 'special@gmail.com',
				googleUserId: 'google-special-chars',
			};

			const newUser: User = {
				id: 'user-special',
				name: "O'Brien-Smith (Jr.) & Co.",
				email: 'special@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-special-chars',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-special',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "O'Brien-Smith (Jr.) & Co.",
				}),
			);
		});

		it('should handle long email addresses', async () => {
			// Arrange: Edge case with very long email
			const longEmail =
				'very.long.email.address.with.many.dots.and.characters@subdomain.example.gmail.com';
			const input = {
				name: 'Long Email User',
				email: longEmail,
				googleUserId: 'google-long-email',
			};

			const existingUser: User = {
				id: 'user-long-email',
				name: 'Long Email User',
				email: longEmail,
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-long-email',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-long-email',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.email).toBe(longEmail);
			}
		});

		it('should handle long Google user IDs', async () => {
			// Arrange: Edge case with very long Google ID
			const longGoogleUserId = `google-${'a'.repeat(100)}`;
			const input = {
				name: 'Long ID User',
				email: 'longid@gmail.com',
				googleUserId: longGoogleUserId,
			};

			const existingUser: User = {
				id: 'user-long-id',
				name: 'Long ID User',
				email: 'longid@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: longGoogleUserId,
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-long-id',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledWith(
				'google',
				longGoogleUserId,
			);
		});

		it('should always use "google" as authProvider when creating user', async () => {
			// Arrange: Verify authProvider is always set correctly
			const input = {
				name: 'Auth Provider Test',
				email: 'authprovider@gmail.com',
				googleUserId: 'google-auth-test',
			};

			const newUser: User = {
				id: 'user-auth-provider',
				name: 'Auth Provider Test',
				email: 'authprovider@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-auth-test',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-auth-provider',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify authProvider is 'google'
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				name: 'Auth Provider Test',
				email: 'authprovider@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-auth-test',
			});
		});

		it('should use googleUserId as providerId when creating user', async () => {
			// Arrange: Verify providerId matches googleUserId
			const input = {
				name: 'Provider ID Test',
				email: 'providerid@gmail.com',
				googleUserId: 'unique-google-id-12345',
			};

			const newUser: User = {
				id: 'user-provider-id',
				name: 'Provider ID Test',
				email: 'providerid@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'unique-google-id-12345',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-provider-id',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify providerId equals googleUserId
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					providerId: 'unique-google-id-12345',
				}),
			);
		});

		it('should generate 12-character random string for password', async () => {
			// Arrange: Verify password generation uses correct length
			const input = {
				name: 'Password Length Test',
				email: 'passwordlength@gmail.com',
				googleUserId: 'google-pwd-length',
			};

			const existingUser: User = {
				id: 'user-pwd-length',
				name: 'Password Length Test',
				email: 'passwordlength@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-pwd-length',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-pwd-length',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify length parameter
			expect(mockCryptoService.generateSecureRandomString).toHaveBeenCalledWith(
				12,
			);
		});

		it('should hash the generated random string', async () => {
			// Arrange: Verify hashing of random string
			const input = {
				name: 'Hash Test',
				email: 'hashtest@gmail.com',
				googleUserId: 'google-hash-test',
			};

			const mockRandomString = 'specific-random-string-abc';
			const mockHashedPassword = 'hashed-specific-random-string';

			const newUser: User = {
				id: 'user-hash-test',
				name: 'Hash Test',
				email: 'hashtest@gmail.com',
				password: mockHashedPassword,
				authProvider: 'google',
				providerId: 'google-hash-test',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-hash-test',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				mockRandomString,
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				mockHashedPassword,
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify exact random string is hashed
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				mockRandomString,
			);

			// Verify hashed password is used in user creation
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					password: mockHashedPassword,
				}),
			);
		});

		it('should pass exact user object to createSessionUseCase', async () => {
			// Arrange: Verify session creation receives correct user
			const input = {
				name: 'Session User Test',
				email: 'sessionuser@gmail.com',
				googleUserId: 'google-session-user',
			};

			const existingUser: User = {
				id: 'user-session-test',
				name: 'Session User Test',
				email: 'sessionuser@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-session-user',
				role: 'user',
				createdAt: new Date('2025-03-01T00:00:00Z'),
				updatedAt: new Date('2025-03-01T00:00:00Z'),
			};

			const mockSession: SessionWithToken = {
				id: 'session-user-test',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify exact user object passed
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(
				existingUser,
			);
		});

		it('should return session value directly from createSessionUseCase result', async () => {
			// Arrange: Verify return value unwrapping
			const input = {
				name: 'Return Test',
				email: 'returntest@gmail.com',
				googleUserId: 'google-return-test',
			};

			const existingUser: User = {
				id: 'user-return-test',
				name: 'Return Test',
				email: 'returntest@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-return-test',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSessionValue: SessionWithToken = {
				id: 'unique-session-id-xyz',
				secretHash: new Uint8Array([10, 20, 30]),
				createdAt: new Date('2025-04-01T12:00:00Z'),
				token: 'unique-session-token-xyz',
				user: {
					name: existingUser.name,
					email: existingUser.email,
					authProvider: existingUser.authProvider,
					role: existingUser.role,
					createdAt: existingUser.createdAt,
					updatedAt: existingUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionValue),
			);

			// Act
			const result = await loginGoogleUserUseCase.execute(input);

			// Assert: Verify exact session value is returned
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe(mockSessionValue);
				expect(result.value.id).toBe('unique-session-id-xyz');
				expect(result.value.token).toBe('unique-session-token-xyz');
				expect(result.value.createdAt).toEqual(
					new Date('2025-04-01T12:00:00Z'),
				);
			}
		});

		it('should execute findByProviderId before user creation', async () => {
			// Arrange: Verify call order
			const input = {
				name: 'Call Order Test',
				email: 'callorder@gmail.com',
				googleUserId: 'google-call-order',
			};

			const newUser: User = {
				id: 'user-call-order',
				name: 'Call Order Test',
				email: 'callorder@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-call-order',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-call-order',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			const mockFindByProviderId = vi
				.mocked(mockUserRepository.findByProviderId)
				.mockResolvedValue(null);
			const mockCreate = vi
				.mocked(mockUserRepository.create)
				.mockResolvedValue(newUser);

			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify findByProviderId called before create
			const findCallOrder =
				mockFindByProviderId.mock.invocationCallOrder[0] ?? 0;
			const createCallOrder = mockCreate.mock.invocationCallOrder[0] ?? 0;

			expect(findCallOrder).toBeLessThan(createCallOrder);
		});

		it('should use input name and email when creating new user', async () => {
			// Arrange: Verify input data is used correctly for new user
			const input = {
				name: 'Exact Name Match',
				email: 'exact.email@gmail.com',
				googleUserId: 'google-exact-match',
			};

			const newUser: User = {
				id: 'user-exact-match',
				name: 'Exact Name Match',
				email: 'exact.email@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-exact-match',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockSession: SessionWithToken = {
				id: 'session-exact-match',
				secretHash: new Uint8Array([1, 2, 3]),
				createdAt: new Date(),
				token: 'session-token',
				user: {
					name: newUser.name,
					email: newUser.email,
					authProvider: newUser.authProvider,
					role: newUser.role,
					createdAt: newUser.createdAt,
					updatedAt: newUser.updatedAt,
				},
			};

			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.generateSecureRandomString).mockReturnValue(
				'random-string',
			);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				'hashed-password',
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(newUser);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSession),
			);

			// Act
			await loginGoogleUserUseCase.execute(input);

			// Assert: Verify exact input values used
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				name: 'Exact Name Match',
				email: 'exact.email@gmail.com',
				password: 'hashed-password',
				authProvider: 'google',
				providerId: 'google-exact-match',
			});
		});
	});
});
