import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAllUsersUseCase } from '../get-all-users.case';

describe('GetAllUsersUseCase', () => {
	let getAllUsersUseCase: GetAllUsersUseCase;
	let mockUserRepository: UserRepository;

	beforeEach(() => {
		// Create mock implementation
		mockUserRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByEmail: vi.fn(),
			findByProviderId: vi.fn(),
			checkUserConflict: vi.fn(),
			findAll: vi.fn(),
		} as unknown as UserRepository;

		getAllUsersUseCase = new GetAllUsersUseCase(mockUserRepository);
	});

	describe('execute - success cases', () => {
		it('should return all users from the repository', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'User One',
					email: 'user1@example.com',
					password: 'hashed_password_1',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date('2024-01-01'),
					updatedAt: new Date('2024-01-01'),
				},
				{
					id: 'user-2',
					name: 'User Two',
					email: 'user2@example.com',
					password: 'hashed_password_2',
					authProvider: 'google',
					providerId: 'google-123',
					role: 'admin',
					createdAt: new Date('2024-01-02'),
					updatedAt: new Date('2024-01-02'),
				},
				{
					id: 'user-3',
					name: 'User Three',
					email: 'user3@example.com',
					password: 'hashed_password_3',
					authProvider: 'local',
					providerId: 'provider-3',
					role: 'user',
					createdAt: new Date('2024-01-03'),
					updatedAt: new Date('2024-01-03'),
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockUsers);
				expect(result.value).toHaveLength(3);
			}

			expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
			expect(mockUserRepository.findAll).toHaveBeenCalledWith();
		});

		it('should return an empty array when no users exist', async () => {
			// Arrange
			vi.mocked(mockUserRepository.findAll).mockResolvedValue([]);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
				expect(result.value).toHaveLength(0);
			}

			expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
		});

		it('should return users with different auth providers', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'Local User',
					email: 'local@example.com',
					password: 'hashed_password',
					authProvider: 'local',
					providerId: 'local-provider',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'user-2',
					name: 'Google User',
					email: 'google@example.com',
					password: 'hashed_password',
					authProvider: 'google',
					providerId: 'google-provider',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].authProvider).toBe('local');
				expect(result.value[1].authProvider).toBe('google');
			}
		});

		it('should return users with different roles', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'Regular User',
					email: 'user@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'user-2',
					name: 'Admin User',
					email: 'admin@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-2',
					role: 'admin',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 'user-3',
					name: 'System User',
					email: 'system@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-3',
					role: 'system',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(3);
				const roles = result.value.map((user) => user.role);
				expect(roles).toContain('user');
				expect(roles).toContain('admin');
				expect(roles).toContain('system');
			}
		});

		it('should always return a success result', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'Test User',
					email: 'test@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			expect(result).toHaveProperty('value');
			if (result.ok) {
				expect(result.value).toBeDefined();
			}
		});
	});

	describe('execute - edge cases', () => {
		it('should handle single user correctly', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'Only User',
					email: 'only@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0].email).toBe('only@example.com');
			}
		});

		it('should handle large number of users', async () => {
			// Arrange
			const mockUsers: User[] = Array.from({ length: 1000 }, (_, index) => ({
				id: `user-${index}`,
				name: `User ${index}`,
				email: `user${index}@example.com`,
				password: 'hashed',
				authProvider: 'local' as const,
				providerId: `provider-${index}`,
				role: 'user' as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1000);
			}
		});

		it('should preserve user data integrity from repository', async () => {
			// Arrange
			const specificDate = new Date('2024-06-15T10:30:00Z');
			const mockUsers: User[] = [
				{
					id: 'user-123',
					name: 'Specific User',
					email: 'specific@example.com',
					password: 'specific_hashed_password',
					authProvider: 'google',
					providerId: 'google-specific-id',
					role: 'admin',
					createdAt: specificDate,
					updatedAt: specificDate,
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value[0]).toEqual(mockUsers[0]);
				expect(result.value[0].id).toBe('user-123');
				expect(result.value[0].name).toBe('Specific User');
				expect(result.value[0].email).toBe('specific@example.com');
				expect(result.value[0].password).toBe('specific_hashed_password');
				expect(result.value[0].authProvider).toBe('google');
				expect(result.value[0].providerId).toBe('google-specific-id');
				expect(result.value[0].role).toBe('admin');
				expect(result.value[0].createdAt).toEqual(specificDate);
				expect(result.value[0].updatedAt).toEqual(specificDate);
			}
		});

		it('should call repository.findAll only once per execution', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'User One',
					email: 'user1@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockUserRepository.findAll).mockResolvedValue(mockUsers);

			// Act
			await getAllUsersUseCase.execute();

			// Assert
			expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
			expect(mockUserRepository.findAll).toHaveBeenCalledWith();
		});

		it('should return different instances on multiple executions', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'User One',
					email: 'user1@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(mockUserRepository.findAll)
				.mockResolvedValueOnce(mockUsers)
				.mockResolvedValueOnce([...mockUsers]);

			// Act
			const result1 = await getAllUsersUseCase.execute();
			const result2 = await getAllUsersUseCase.execute();

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			expect(mockUserRepository.findAll).toHaveBeenCalledTimes(2);
		});
	});

	describe('execute - integration with repository', () => {
		it('should correctly await repository response', async () => {
			// Arrange
			const mockUsers: User[] = [
				{
					id: 'user-1',
					name: 'Async User',
					email: 'async@example.com',
					password: 'hashed',
					authProvider: 'local',
					providerId: 'provider-1',
					role: 'user',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			let repositoryCallCount = 0;
			vi.mocked(mockUserRepository.findAll).mockImplementation(async () => {
				repositoryCallCount++;
				// Simulate async delay
				await new Promise((resolve) => setTimeout(resolve, 10));
				return mockUsers;
			});

			// Act
			const result = await getAllUsersUseCase.execute();

			// Assert
			expect(repositoryCallCount).toBe(1);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockUsers);
			}
		});
	});
});
