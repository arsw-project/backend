import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetUserByEmailUseCase } from '../get-user-by-email.case';

describe('GetUserByEmailUseCase', () => {
	let getUserByEmailUseCase: GetUserByEmailUseCase;
	let mockUserRepository: UserRepository;

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

		getUserByEmailUseCase = new GetUserByEmailUseCase(mockUserRepository);
	});

	describe('execute - success cases', () => {
		it('should return user when found by email', async () => {
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);

			const result = await getUserByEmailUseCase.execute('test@example.com');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockUser);
			}
			expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
				'test@example.com',
			);
		});
	});

	describe('execute - error cases', () => {
		it('should return UserNotFoundError when user does not exist', async () => {
			vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

			const result = await getUserByEmailUseCase.execute(
				'nonexistent@example.com',
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
				expect(result.error.code).toBe('USER_NOT_FOUND');
			}
		});
	});
});
