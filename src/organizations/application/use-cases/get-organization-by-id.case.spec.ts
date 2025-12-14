import { Membership } from '@organizations/domain/entities/membership.entity';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { SessionUserDto } from '@users/application/dto/session-user.dto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetOrganizationByIdUseCase } from './get-organization-by-id.case';

describe('GetOrganizationByIdUseCase', () => {
	let useCase: GetOrganizationByIdUseCase;
	let repository: OrganizationRepository;
	let membershipRepository: MembershipRepository;

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

		membershipRepository = {
			findByUserAndOrganization: vi.fn(),
			findByUser: vi.fn(),
			findByOrganization: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			update: vi.fn(),
			deleteByOrganization: vi.fn(),
			countByOrganization: vi.fn(),
			countOwnersByOrganization: vi.fn(),
		} as unknown as MembershipRepository;

		useCase = new GetOrganizationByIdUseCase(repository, membershipRepository);
	});

	describe('execute', () => {
		const mockOrganization: Organization = {
			id: '123',
			name: 'Test Organization',
			description: 'Test Description',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		};

		const mockMembership: Membership = {
			id: 'membership-1',
			userId: 'user-1',
			organizationId: '123',
			role: 'admin',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockSystemUser: SessionUserDto = {
			id: 'user-system',
			name: 'System User',
			email: 'system@example.com',
			authProvider: 'local',
			role: 'system',
			membership: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockAdminUser: SessionUserDto = {
			id: 'user-1',
			name: 'Admin User',
			email: 'admin@example.com',
			authProvider: 'local',
			role: 'admin',
			membership: {
				id: 'membership-1',
				organizationId: '123',
				role: 'admin',
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should return organization for system user regardless of membership', async () => {
			// Arrange
			vi.mocked(repository.findById).mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('123', mockSystemUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganization);
			}
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(
				membershipRepository.findByUserAndOrganization,
			).not.toHaveBeenCalled();
		});

		it('should return organization when user is a member', async () => {
			// Arrange
			vi.mocked(repository.findById).mockResolvedValue(mockOrganization);
			vi.mocked(
				membershipRepository.findByUserAndOrganization,
			).mockResolvedValue(mockMembership);

			// Act
			const result = await useCase.execute('123', mockAdminUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganization);
			}
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(
				membershipRepository.findByUserAndOrganization,
			).toHaveBeenCalledWith('user-1', '123');
		});

		it('should return null when user is not a member', async () => {
			// Arrange
			vi.mocked(repository.findById).mockResolvedValue(mockOrganization);
			vi.mocked(
				membershipRepository.findByUserAndOrganization,
			).mockResolvedValue(null);

			// Act
			const result = await useCase.execute('123', mockAdminUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(
				membershipRepository.findByUserAndOrganization,
			).toHaveBeenCalledWith('user-1', '123');
		});

		it('should return null when user is not authenticated', async () => {
			// Arrange
			vi.mocked(repository.findById).mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('123', null);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(
				membershipRepository.findByUserAndOrganization,
			).not.toHaveBeenCalled();
		});

		it('should return null when organization not found', async () => {
			// Arrange
			vi.mocked(repository.findById).mockResolvedValue(null);

			// Act
			const result = await useCase.execute('non-existent-id', mockAdminUser);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(repository.findById).toHaveBeenCalledWith('non-existent-id');
			expect(
				membershipRepository.findByUserAndOrganization,
			).not.toHaveBeenCalled();
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(repository.findById).mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('123', mockAdminUser)).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findById).toHaveBeenCalledWith('123');
		});
	});
});
