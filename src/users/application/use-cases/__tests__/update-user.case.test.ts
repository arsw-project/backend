import { CryptoService } from '@auth/application/services/crypto.service';
import { UpdateUserDto } from '@users/application/dto/update-user.dto';
import { UserConflictError } from '@users/application/errors/user-conflict.error';
import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateUserUseCase } from '../update-user.case';

describe('UpdateUserUseCase', () => {
	let updateUserUseCase: UpdateUserUseCase;
	let mockUserRepository: UserRepository;
	let mockCryptoService: CryptoService;

	const mockUser: User = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
		password: 'hashed_password',
		authProvider: 'local',
		providerId: 'provider-123',
		role: 'user',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mockUserRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByEmail: vi.fn(),
			findByProviderId: vi.fn(),
			checkUserConflict: vi.fn(),
			findAll: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as UserRepository;

		mockCryptoService = {
			hashPassword: vi.fn(),
			verifyPassword: vi.fn(),
			generateSecureRandomString: vi.fn(),
			hashSecret: vi.fn(),
			constantTimeEqual: vi.fn(),
		} as unknown as CryptoService;

		updateUserUseCase = new UpdateUserUseCase(
			mockUserRepository,
			mockCryptoService,
		);
	});

	describe('execute - success cases', () => {
		it('should update user name successfully', async () => {
			const updateDto: UpdateUserDto = { name: 'Updated Name' };
			const updatedUser: User = { ...mockUser, name: 'Updated Name' };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockUserRepository.update).mockResolvedValue(updatedUser);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.name).toBe('Updated Name');
			}
			expect(mockCryptoService.hashPassword).not.toHaveBeenCalled();
		});

		it('should update user email successfully when no conflict', async () => {
			const updateDto: UpdateUserDto = { email: 'newemail@example.com' };
			const updatedUser: User = { ...mockUser, email: 'newemail@example.com' };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
			vi.mocked(mockUserRepository.update).mockResolvedValue(updatedUser);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.email).toBe('newemail@example.com');
			}
		});

		it('should hash password when updating password', async () => {
			const updateDto: UpdateUserDto = { password: 'newpassword123' };
			const hashedPassword = 'new_hashed_password';
			const updatedUser: User = { ...mockUser, password: hashedPassword };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockCryptoService.hashPassword).mockResolvedValue(
				hashedPassword,
			);
			vi.mocked(mockUserRepository.update).mockResolvedValue(updatedUser);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(true);
			expect(mockCryptoService.hashPassword).toHaveBeenCalledWith(
				'newpassword123',
			);
			expect(mockUserRepository.update).toHaveBeenCalledWith(
				'user-123',
				expect.objectContaining({ password: hashedPassword }),
			);
		});

		it('should allow same email without conflict check', async () => {
			const updateDto: UpdateUserDto = { email: 'test@example.com' };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockUserRepository.update).mockResolvedValue(mockUser);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(true);
			expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
		});

		it('should update user role successfully', async () => {
			const updateDto: UpdateUserDto = { role: 'admin' };
			const updatedUser: User = { ...mockUser, role: 'admin' };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockUserRepository.update).mockResolvedValue(updatedUser);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.role).toBe('admin');
			}
		});
	});

	describe('execute - error cases', () => {
		it('should return UserNotFoundError when user does not exist', async () => {
			const updateDto: UpdateUserDto = { name: 'Updated Name' };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

			const result = await updateUserUseCase.execute(
				'non-existent-id',
				updateDto,
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
				expect(result.error.code).toBe('USER_NOT_FOUND');
			}
			expect(mockUserRepository.update).not.toHaveBeenCalled();
		});

		it('should return UserConflictError when email is already in use', async () => {
			const updateDto: UpdateUserDto = { email: 'existing@example.com' };
			const existingUser: User = {
				...mockUser,
				id: 'other-user',
				email: 'existing@example.com',
			};

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserConflictError);
				expect(result.error.code).toBe('USER_CONFLICT');
				if (result.error instanceof UserConflictError) {
					expect(result.error.issues).toContainEqual(
						expect.objectContaining({
							path: ['email'],
							message: 'Email is already in use',
						}),
					);
				}
			}
			expect(mockUserRepository.update).not.toHaveBeenCalled();
		});

		it('should return UserNotFoundError when update returns null', async () => {
			const updateDto: UpdateUserDto = { name: 'Updated Name' };

			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(mockUserRepository.update).mockResolvedValue(null);

			const result = await updateUserUseCase.execute('user-123', updateDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
			}
		});
	});
});
