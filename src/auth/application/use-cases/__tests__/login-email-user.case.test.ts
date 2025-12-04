import { LoginUserDto } from '@auth/application/dto/login-user.dto';
import {
	InvalidCredentialsError,
	UserNotFoundError,
} from '@auth/application/errors/login.error';
import { CryptoService } from '@auth/application/services/crypto.service';
import { CreateSessionUseCase } from '@auth/application/use-cases/create-session.case';
import { LoginEmailUserUseCase } from '@auth/application/use-cases/login-email-user.case';
import { SessionWithToken } from '@auth/domain/entities/session.entity';
import { ok } from '@common/utility/results';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LoginEmailUserUseCase', () => {
	// 1. Declare test subject and dependencies
	let loginEmailUserUseCase: LoginEmailUserUseCase;
	let mockCryptoService: CryptoService;
	let mockUserRepository: UserRepository;
	let mockCreateSessionUseCase: CreateSessionUseCase;

	// 2. Setup fresh instances before each test
	beforeEach(() => {
		// Create mock implementations
		mockCryptoService = {
			hashPassword: vi.fn(),
			verifyPassword: vi.fn(),
			generateSecureRandomString: vi.fn(),
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
		loginEmailUserUseCase = new LoginEmailUserUseCase(
			mockCryptoService,
			mockUserRepository,
			mockCreateSessionUseCase,
		);
	});

	// 3. Group tests by scenario
	describe('execute - success cases', () => {
		it('should successfully login user with valid email and password', async () => {
			// Arrange: Setup test data and mocks
			const loginDto: LoginUserDto = {
				email: 'test@example.com',
				password: 'password123',
			};

			const mockUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed_password_123',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-123',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'mock-session-token-abc123',
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act: Execute the method under test
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert: Verify outcomes
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockSessionWithToken);
				expect(result.value.token).toBe('mock-session-token-abc123');
				expect(result.value.user.email).toBe('test@example.com');
				expect(result.value.user.name).toBe('Test User');
			}

			// Verify dependencies were called correctly
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
			expect(mockCryptoService.verifyPassword).toHaveBeenCalledWith(
				'hashed_password_123',
				'password123',
			);
			expect(mockCryptoService.verifyPassword).toHaveBeenCalledTimes(1);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(mockUser);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledTimes(1);
		});

		it('should successfully login user with different email case sensitivity', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'TEST@EXAMPLE.COM',
				password: 'password123',
			};

			const mockUser: User = {
				id: 'user-456',
				name: 'Another User',
				email: 'TEST@EXAMPLE.COM',
				password: 'hashed_pass',
				authProvider: 'local',
				providerId: 'provider-456',
				role: 'admin',
				createdAt: new Date('2025-02-01'),
				updatedAt: new Date('2025-02-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-456',
				secretHash: new Uint8Array([5, 6, 7, 8]),
				createdAt: new Date('2025-02-15'),
				token: 'admin-session-token-xyz789',
				user: {
					id: 'user-id',
					name: 'Another User',
					email: 'TEST@EXAMPLE.COM',
					authProvider: 'local',
					role: 'admin',
					memberships: [],
					createdAt: new Date('2025-02-01'),
					updatedAt: new Date('2025-02-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.role).toBe('admin');
				expect(result.value.user.email).toBe('TEST@EXAMPLE.COM');
			}

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'TEST@EXAMPLE.COM',
			);
		});

		it('should create session with user object from repository', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'user@test.com',
				password: 'mypassword',
			};

			const mockUser: User = {
				id: 'user-789',
				name: 'Session Test User',
				email: 'user@test.com',
				password: 'hashed_mypassword',
				authProvider: 'local',
				providerId: 'provider-789',
				role: 'user',
				createdAt: new Date('2025-03-01'),
				updatedAt: new Date('2025-03-05'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-789',
				secretHash: new Uint8Array([9, 10, 11, 12]),
				createdAt: new Date('2025-03-10'),
				token: 'session-token-123',
				user: {
					id: 'user-id',
					name: 'Session Test User',
					email: 'user@test.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-03-01'),
					updatedAt: new Date('2025-03-05'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);

			// Verify that createSessionUseCase was called with the exact user object
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(mockUser);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'user-789',
					name: 'Session Test User',
					email: 'user@test.com',
				}),
			);
		});
	});

	describe('execute - error cases', () => {
		it('should return error when user is not found', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'nonexistent@example.com',
				password: 'password123',
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
				expect(result.error.code).toBe('USER_NOT_FOUND');
				expect(result.error.message).toBe('User not found');
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0]).toMatchObject({
					code: 'custom',
					message: 'No user found with the provided email',
					path: ['email'],
				});
			}

			// Verify dependencies were called correctly
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'nonexistent@example.com',
			);
			expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);

			// Verify password verification was NOT called
			expect(mockCryptoService.verifyPassword).not.toHaveBeenCalled();

			// Verify session creation was NOT called
			expect(mockCreateSessionUseCase.execute).not.toHaveBeenCalled();
		});

		it('should return error when password is invalid', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'test@example.com',
				password: 'wrongpassword',
			};

			const mockUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed_correct_password',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(false);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidCredentialsError);
				expect(result.error.code).toBe('INVALID_CREDENTIALS');
				expect(result.error.message).toBe('Invalid credentials');
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0]).toMatchObject({
					code: 'custom',
					message: 'The provided password is incorrect',
					path: ['password'],
				});
			}

			// Verify dependencies were called correctly
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(mockCryptoService.verifyPassword).toHaveBeenCalledWith(
				'hashed_correct_password',
				'wrongpassword',
			);

			// Verify session creation was NOT called due to invalid password
			expect(mockCreateSessionUseCase.execute).not.toHaveBeenCalled();
		});

		it('should return error when password is empty string', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'test@example.com',
				password: '',
			};

			const mockUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(false);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidCredentialsError);
			}

			expect(mockCryptoService.verifyPassword).toHaveBeenCalledWith(
				'hashed_password',
				'',
			);
			expect(mockCreateSessionUseCase.execute).not.toHaveBeenCalled();
		});

		it('should return error when user exists but password verification fails', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'admin@example.com',
				password: 'incorrect_admin_pass',
			};

			const mockAdminUser: User = {
				id: 'admin-123',
				name: 'Admin User',
				email: 'admin@example.com',
				password: 'hashed_admin_password',
				authProvider: 'local',
				providerId: 'admin-provider-123',
				role: 'admin',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				mockAdminUser,
			);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(false);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(InvalidCredentialsError);
				expect(result.error.code).toBe('INVALID_CREDENTIALS');
			}

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'admin@example.com',
			);
			expect(mockCryptoService.verifyPassword).toHaveBeenCalledWith(
				'hashed_admin_password',
				'incorrect_admin_pass',
			);
			expect(mockCreateSessionUseCase.execute).not.toHaveBeenCalled();
		});
	});

	describe('execute - edge cases', () => {
		it('should handle null user from repository', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'null@example.com',
				password: 'password123',
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
			}

			expect(mockCryptoService.verifyPassword).not.toHaveBeenCalled();
			expect(mockCreateSessionUseCase.execute).not.toHaveBeenCalled();
		});

		it('should handle undefined user from repository', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'undefined@example.com',
				password: 'password123',
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				undefined as unknown as User,
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
			}

			expect(mockCryptoService.verifyPassword).not.toHaveBeenCalled();
			expect(mockCreateSessionUseCase.execute).not.toHaveBeenCalled();
		});

		it('should not mutate input parameters', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'test@example.com',
				password: 'password123',
			};
			const originalDto = { ...loginDto };

			const mockUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-123',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-123',
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(loginDto).toEqual(originalDto);
		});

		it('should handle special characters in email', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'user+test@example.com',
				password: 'password123',
			};

			const mockUser: User = {
				id: 'user-special',
				name: 'Special User',
				email: 'user+test@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: 'provider-special',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-special',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-special',
				user: {
					id: 'user-id',
					name: 'Special User',
					email: 'user+test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.email).toBe('user+test@example.com');
			}

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'user+test@example.com',
			);
		});

		it('should handle very long passwords', async () => {
			// Arrange
			const longPassword = 'a'.repeat(1000);
			const loginDto: LoginUserDto = {
				email: 'test@example.com',
				password: longPassword,
			};

			const mockUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed_long_password',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-123',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-123',
				user: {
					id: 'user-id',
					name: 'Test User',
					email: 'test@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockCryptoService.verifyPassword).toHaveBeenCalledWith(
				'hashed_long_password',
				longPassword,
			);
		});

		it('should handle concurrent login attempts for same user', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'concurrent@example.com',
				password: 'password123',
			};

			const mockUser: User = {
				id: 'user-concurrent',
				name: 'Concurrent User',
				email: 'concurrent@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: 'provider-concurrent',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken1: SessionWithToken = {
				id: 'session-1',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-1',
				user: {
					id: 'user-id',
					name: 'Concurrent User',
					email: 'concurrent@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			const mockSessionWithToken2: SessionWithToken = {
				id: 'session-2',
				secretHash: new Uint8Array([5, 6, 7, 8]),
				createdAt: new Date('2025-01-15'),
				token: 'token-2',
				user: {
					id: 'user-id',
					name: 'Concurrent User',
					email: 'concurrent@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute)
				.mockResolvedValueOnce(ok(mockSessionWithToken1))
				.mockResolvedValueOnce(ok(mockSessionWithToken2));

			// Act
			const [result1, result2] = await Promise.all([
				loginEmailUserUseCase.execute(loginDto),
				loginEmailUserUseCase.execute(loginDto),
			]);

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			if (result1.ok && result2.ok) {
				expect(result1.value.token).toBe('token-1');
				expect(result2.value.token).toBe('token-2');
				expect(result1.value.id).not.toBe(result2.value.id);
			}

			expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(2);
			expect(mockCryptoService.verifyPassword).toHaveBeenCalledTimes(2);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledTimes(2);
		});

		it('should handle user with Google auth provider', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'google@example.com',
				password: 'google_password',
			};

			const mockGoogleUser: User = {
				id: 'user-google',
				name: 'Google User',
				email: 'google@example.com',
				password: 'hashed_google_password',
				authProvider: 'google',
				providerId: 'google-provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-google',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-google',
				user: {
					id: 'user-id',
					name: 'Google User',
					email: 'google@example.com',
					authProvider: 'google',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				mockGoogleUser,
			);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.authProvider).toBe('google');
			}
		});

		it('should handle system role user login', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'system@example.com',
				password: 'system_password',
			};

			const mockSystemUser: User = {
				id: 'user-system',
				name: 'System User',
				email: 'system@example.com',
				password: 'hashed_system_password',
				authProvider: 'local',
				providerId: 'system-provider-123',
				role: 'system',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-system',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-system',
				user: {
					id: 'user-id',
					name: 'System User',
					email: 'system@example.com',
					authProvider: 'local',
					role: 'system',
					memberships: [],
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				mockSystemUser,
			);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.user.role).toBe('system');
			}
		});

		it('should handle user with null providerId', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'noprovider@example.com',
				password: 'password123',
			};

			const mockUser: User = {
				id: 'user-noprovider',
				name: 'No Provider User',
				email: 'noprovider@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: null,
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-noprovider',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-noprovider',
				user: {
					id: 'user-id',
					name: 'No Provider User',
					email: 'noprovider@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.verifyPassword).mockResolvedValue(true);
			vi.mocked(mockCreateSessionUseCase.execute).mockResolvedValue(
				ok(mockSessionWithToken),
			);

			// Act
			const result = await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(result.ok).toBe(true);
			expect(mockCreateSessionUseCase.execute).toHaveBeenCalledWith(
				expect.objectContaining({
					providerId: null,
				}),
			);
		});
	});

	describe('execute - execution flow verification', () => {
		it('should execute operations in correct order: find user, verify password, create session', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'flow@example.com',
				password: 'password123',
			};

			const callOrder: string[] = [];

			const mockUser: User = {
				id: 'user-flow',
				name: 'Flow User',
				email: 'flow@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: 'provider-flow',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			const mockSessionWithToken: SessionWithToken = {
				id: 'session-flow',
				secretHash: new Uint8Array([1, 2, 3, 4]),
				createdAt: new Date('2025-01-15'),
				token: 'token-flow',
				user: {
					id: 'user-id',
					name: 'Flow User',
					email: 'flow@example.com',
					authProvider: 'local',
					role: 'user',
					memberships: [],
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-01'),
				},
			};

			vi.mocked(mockUserRepository.findByEmail).mockImplementation(
				async (_email) => {
					callOrder.push('findByEmail');
					return mockUser;
				},
			);

			vi.mocked(mockCryptoService.verifyPassword).mockImplementation(
				async (_hash, _password) => {
					callOrder.push('verifyPassword');
					return true;
				},
			);

			vi.mocked(mockCreateSessionUseCase.execute).mockImplementation(
				async (_user) => {
					callOrder.push('createSession');
					return ok(mockSessionWithToken);
				},
			);

			// Act
			await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(callOrder).toEqual([
				'findByEmail',
				'verifyPassword',
				'createSession',
			]);
		});

		it('should stop execution after user not found without calling subsequent methods', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'notfound@example.com',
				password: 'password123',
			};

			const callOrder: string[] = [];

			vi.mocked(mockUserRepository.findByEmail).mockImplementation(
				async (_email) => {
					callOrder.push('findByEmail');
					return null;
				},
			);

			vi.mocked(mockCryptoService.verifyPassword).mockImplementation(
				async (_hash, _password) => {
					callOrder.push('verifyPassword');
					return true;
				},
			);

			vi.mocked(mockCreateSessionUseCase.execute).mockImplementation(
				async (_user) => {
					callOrder.push('createSession');
					return ok({} as SessionWithToken);
				},
			);

			// Act
			await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(callOrder).toEqual(['findByEmail']);
			expect(callOrder).not.toContain('verifyPassword');
			expect(callOrder).not.toContain('createSession');
		});

		it('should stop execution after invalid password without calling createSession', async () => {
			// Arrange
			const loginDto: LoginUserDto = {
				email: 'test@example.com',
				password: 'wrongpassword',
			};

			const callOrder: string[] = [];

			const mockUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed_password',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-01'),
			};

			vi.mocked(mockUserRepository.findByEmail).mockImplementation(
				async (_email) => {
					callOrder.push('findByEmail');
					return mockUser;
				},
			);

			vi.mocked(mockCryptoService.verifyPassword).mockImplementation(
				async (_hash, _password) => {
					callOrder.push('verifyPassword');
					return false;
				},
			);

			vi.mocked(mockCreateSessionUseCase.execute).mockImplementation(
				async (_user) => {
					callOrder.push('createSession');
					return ok({} as SessionWithToken);
				},
			);

			// Act
			await loginEmailUserUseCase.execute(loginDto);

			// Assert
			expect(callOrder).toEqual(['findByEmail', 'verifyPassword']);
			expect(callOrder).not.toContain('createSession');
		});
	});
});
