import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { SessionUserDto } from '@users/application/dto/session-user.dto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAllOrganizationsUseCase } from './get-all-organizations.case';

describe('GetAllOrganizationsUseCase', () => {
	let useCase: GetAllOrganizationsUseCase;
	let repository: OrganizationRepository;

	beforeEach(() => {
		repository = {
			findAll: vi.fn(),
			findById: vi.fn(),
			findByName: vi.fn(),
			findByUserId: vi.fn(),
			checkOrganizationConflict: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as OrganizationRepository;

		useCase = new GetAllOrganizationsUseCase(repository);
	});

	describe('execute', () => {
		const mockOrganizations: Organization[] = [
			{
				id: '1',
				name: 'Organization 1',
				description: 'Description 1',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			},
			{
				id: '2',
				name: 'Organization 2',
				description: 'Description 2',
				createdAt: new Date('2024-01-02'),
				updatedAt: new Date('2024-01-02'),
			},
			{
				id: '3',
				name: 'Organization 3',
				description: 'Description 3',
				createdAt: new Date('2024-01-03'),
				updatedAt: new Date('2024-01-03'),
			},
		];

		const mockSystemUser: SessionUserDto = {
			id: 'user-1',
			name: 'System User',
			email: 'system@example.com',
			authProvider: 'local',
			role: 'system',
			membership: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockAdminUser: SessionUserDto = {
			id: 'user-2',
			name: 'Admin User',
			email: 'admin@example.com',
			authProvider: 'local',
			role: 'admin',
			membership: {
				id: 'membership-1',
				organizationId: 'org-1',
				role: 'admin',
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockRegularUser: SessionUserDto = {
			id: 'user-3',
			name: 'Regular User',
			email: 'user@example.com',
			authProvider: 'local',
			role: 'user',
			membership: {
				id: 'membership-2',
				organizationId: 'org-2',
				role: 'member',
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should return all organizations for system role user', async () => {
			// Arrange
			vi.mocked(repository.findAll).mockResolvedValue(mockOrganizations);

			// Act
			const result = await useCase.execute(mockSystemUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganizations);
				expect(result.value).toHaveLength(3);
			}
			expect(repository.findAll).toHaveBeenCalledTimes(1);
			expect(repository.findByUserId).not.toHaveBeenCalled();
		});

		it('should return user organizations for admin role user', async () => {
			// Arrange
			const userOrgs = [mockOrganizations[0]];
			vi.mocked(repository.findByUserId).mockResolvedValue(userOrgs);

			// Act
			const result = await useCase.execute(mockAdminUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(userOrgs);
				expect(result.value).toHaveLength(1);
			}
			expect(repository.findByUserId).toHaveBeenCalledWith('user-2');
			expect(repository.findAll).not.toHaveBeenCalled();
		});

		it('should return user organizations for regular user role', async () => {
			// Arrange
			const userOrgs = [mockOrganizations[1]];
			vi.mocked(repository.findByUserId).mockResolvedValue(userOrgs);

			// Act
			const result = await useCase.execute(mockRegularUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(userOrgs);
			}
			expect(repository.findByUserId).toHaveBeenCalledWith('user-3');
		});

		it('should return empty array when user is not authenticated', async () => {
			// Act
			const result = await useCase.execute(null);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
			}
			expect(repository.findAll).not.toHaveBeenCalled();
			expect(repository.findByUserId).not.toHaveBeenCalled();
		});

		it('should return empty array when no organizations exist for user for user', async () => {
			// Arrange
			vi.mocked(repository.findByUserId).mockResolvedValue([]);

			// Act
			const result = await useCase.execute(mockRegularUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
				expect(result.value).toHaveLength(0);
			}
			expect(repository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(repository.findAll).mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute(mockSystemUser)).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findAll).toHaveBeenCalledTimes(1);
		});
	});
});
