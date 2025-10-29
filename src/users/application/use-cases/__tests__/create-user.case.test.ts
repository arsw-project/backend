import { CryptoService } from '@auth/application/services/crypto.service';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UserConflictError } from '@users/application/errors/user-conflict.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserUseCase } from '../create-user.case';

describe('CreateUserUseCase', () => {
	let createUserUseCase: CreateUserUseCase;
	let mockUserRepository: UserRepository;
	let mockCryptoService: CryptoService;

	beforeEach(() => {
		// Create mock implementations
		mockUserRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByEmail: vi.fn(),
			findByProviderId: vi.fn(),
			checkUserConflict: vi.fn(),
			findAll: vi.fn(),
		} as unknown as UserRepository;

		mockCryptoService = {
			hashPassword: vi.fn(),
			verifyPassword: vi.fn(),
			generateSecureRandomString: vi.fn(),
			hashSecret: vi.fn(),
			constantTimeEqual: vi.fn(),
		} as unknown as CryptoService;

		createUserUseCase = new CreateUserUseCase(
			mockUserRepository,
			mockCryptoService,
		);
	});

	describe('execute - success cases', () => {
		it('should successfully create a local user with generated providerId', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				authProvider: 'local',
				providerId: null,
			};

			const hashedPassword = 'hashed_password_123';
			const expectedUser: User = {
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: hashedPassword,
				authProvider: 'local',
				providerId: expect.any(String),
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				hashedPassword,
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(expectedUser);

			// Act
			const result = await createUserUseCase.execute(createUserDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(expectedUser);
				expect(result.value.providerId).toBeTruthy();
			}

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledWith(
				'local',
				expect.any(String),
			);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				'password123',
			);
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Test User',
					email: 'test@example.com',
					password: hashedPassword,
					authProvider: 'local',
					providerId: expect.any(String),
				}),
			);
		});

		it('should successfully create a Google user with provided providerId', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Google User',
				email: 'google@example.com',
				password: 'google_password',
				authProvider: 'google',
				providerId: 'google-123',
			};

			const hashedPassword = 'hashed_google_password';
			const expectedUser: User = {
				id: 'user-456',
				name: 'Google User',
				email: 'google@example.com',
				password: hashedPassword,
				authProvider: 'google',
				providerId: 'google-123',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				hashedPassword,
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue(expectedUser);

			// Act
			const result = await createUserUseCase.execute(createUserDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(expectedUser);
				expect(result.value.authProvider).toBe('google');
				expect(result.value.providerId).toBe('google-123');
			}

			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'google@example.com',
			);
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledWith(
				'google',
				'google-123',
			);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				'google_password',
			);
		});

		it('should hash the password before creating the user', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'plain_password',
				authProvider: 'local',
				providerId: null,
			};

			const hashedPassword = 'super_secure_hash';

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				hashedPassword,
			);
			vi.mocked(mockUserRepository.create).mockResolvedValue({
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: hashedPassword,
				authProvider: 'local',
				providerId: 'generated-id',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			await createUserUseCase.execute(createUserDto);

			// Assert
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				'plain_password',
			);
			expect(mockUserRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					password: hashedPassword,
				}),
			);
		});
	});

	describe('execute - error cases', () => {
		it('should return error when email already exists', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'existing@example.com',
				password: 'password123',
				authProvider: 'local',
				providerId: null,
			};

			const existingUser: User = {
				id: 'existing-user',
				name: 'Existing User',
				email: 'existing@example.com',
				password: 'hashed',
				authProvider: 'local',
				providerId: 'provider-123',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);

			// Act
			const result = await createUserUseCase.execute(createUserDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserConflictError);
				expect(result.error.code).toBe('USER_CONFLICT');
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0]).toMatchObject({
					code: 'custom',
					message: 'Email is already in use',
					path: ['email'],
				});
			}

			expect(mockCryptoService.hashPassword).not.toHaveBeenCalled();
			expect(mockUserRepository.create).not.toHaveBeenCalled();
		});

		it('should return error when providerId already exists', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				authProvider: 'google',
				providerId: 'existing-provider-id',
			};

			const existingUser: User = {
				id: 'existing-user',
				name: 'Existing User',
				email: 'other@example.com',
				password: 'hashed',
				authProvider: 'google',
				providerId: 'existing-provider-id',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingUser,
			);

			// Act
			const result = await createUserUseCase.execute(createUserDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserConflictError);
				expect(result.error.code).toBe('USER_CONFLICT');
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0]).toMatchObject({
					code: 'custom',
					message: 'Provider ID is already in use',
					path: ['providerId'],
				});
			}

			expect(mockCryptoService.hashPassword).not.toHaveBeenCalled();
			expect(mockUserRepository.create).not.toHaveBeenCalled();
		});

		it('should return error with both conflicts when email and providerId exist', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'existing@example.com',
				password: 'password123',
				authProvider: 'google',
				providerId: 'existing-provider-id',
			};

			const existingEmailUser: User = {
				id: 'user-1',
				name: 'User 1',
				email: 'existing@example.com',
				password: 'hashed',
				authProvider: 'local',
				providerId: 'provider-1',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const existingProviderUser: User = {
				id: 'user-2',
				name: 'User 2',
				email: 'other@example.com',
				password: 'hashed',
				authProvider: 'google',
				providerId: 'existing-provider-id',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(
				existingEmailUser,
			);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(
				existingProviderUser,
			);

			// Act
			const result = await createUserUseCase.execute(createUserDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserConflictError);
				expect(result.error.code).toBe('USER_CONFLICT');
				expect(result.error.issues).toHaveLength(2);

				const emailIssue = result.error.issues.find((i) =>
					i.path.includes('email'),
				);
				const providerIssue = result.error.issues.find((i) =>
					i.path.includes('providerId'),
				);

				expect(emailIssue).toMatchObject({
					code: 'custom',
					message: 'Email is already in use',
					path: ['email'],
				});

				expect(providerIssue).toMatchObject({
					code: 'custom',
					message: 'Provider ID is already in use',
					path: ['providerId'],
				});
			}

			expect(mockCryptoService.hashPassword).not.toHaveBeenCalled();
			expect(mockUserRepository.create).not.toHaveBeenCalled();
		});
	});

	describe('execute - edge cases', () => {
		it('should handle concurrent conflict checks correctly', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				authProvider: 'local',
				providerId: null,
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue('hashed');
			vi.mocked(mockUserRepository.create).mockResolvedValue({
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed',
				authProvider: 'local',
				providerId: 'generated-id',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			const result = await createUserUseCase.execute(createUserDto);

			// Assert
			expect(result.ok).toBe(true);
			// Verify both checks were called (Promise.all behavior)
			expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
			expect(mockUserRepository.findByProviderId).toHaveBeenCalledTimes(1);
		});

		it('should not modify the original DTO when generating providerId', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				authProvider: 'local',
				providerId: null,
			};

			const originalDto = { ...createUserDto };

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue('hashed');
			vi.mocked(mockUserRepository.create).mockResolvedValue({
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
				password: 'hashed',
				authProvider: 'local',
				providerId: 'generated-id',
				role: 'user',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			await createUserUseCase.execute(createUserDto);

			// Assert
			expect(createUserDto).toEqual(originalDto);
		});

		it('should generate different providerIds for local users', async () => {
			// Arrange
			const createUserDto: CreateUserDto = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				authProvider: 'local',
				providerId: null,
			};

			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.findByProviderId).mockResolvedValue(null);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue('hashed');

			const createdProviderIds: string[] = [];
			vi.mocked(mockUserRepository.create).mockImplementation(
				async (dto: CreateUserDto) => {
					createdProviderIds.push(dto.providerId as string);
					return {
						id: 'user-123',
						name: dto.name,
						email: dto.email,
						password: dto.password,
						authProvider: dto.authProvider,
						providerId: dto.providerId,
						role: 'user',
						createdAt: new Date(),
						updatedAt: new Date(),
					};
				},
			);

			// Act
			await createUserUseCase.execute(createUserDto);
			await createUserUseCase.execute(createUserDto);

			// Assert
			expect(createdProviderIds).toHaveLength(2);
			expect(createdProviderIds[0]).not.toBe(createdProviderIds[1]);
		});
	});
});
