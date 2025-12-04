import { MembershipAlreadyExistsError } from '@organizations/application/errors/membership.error';
import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { UserNotFoundError } from '@users/application/errors/user-not-found.error';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddMemberUseCase } from './add-member.case';

describe('AddMemberUseCase', () => {
	let addMemberUseCase: AddMemberUseCase;
	let mockMembershipRepository: MembershipRepository;
	let mockOrganizationRepository: OrganizationRepository;
	let mockUserRepository: UserRepository;

	const mockOrganization = {
		id: 'org-123',
		name: 'Test Org',
		description: 'Test Description',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUser = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
		password: 'hashed',
		authProvider: 'local' as const,
		providerId: 'provider-123',
		role: 'user' as const,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockMembership: Membership = {
		id: 'membership-123',
		userId: 'user-123',
		organizationId: 'org-123',
		role: 'member',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mockMembershipRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByUserAndOrganization: vi.fn(),
			findByOrganization: vi.fn(),
			findByUser: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteByOrganization: vi.fn(),
			countByOrganization: vi.fn(),
			countOwnersByOrganization: vi.fn(),
		} as unknown as MembershipRepository;

		mockOrganizationRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findByName: vi.fn(),
			checkOrganizationConflict: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findAll: vi.fn(),
		} as unknown as OrganizationRepository;

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

		addMemberUseCase = new AddMemberUseCase(
			mockMembershipRepository,
			mockOrganizationRepository,
			mockUserRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should add a member successfully', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(
				mockOrganization,
			);
			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(
				mockMembershipRepository.findByUserAndOrganization,
			).mockResolvedValue(null);
			vi.mocked(mockMembershipRepository.create).mockResolvedValue(
				mockMembership,
			);

			const result = await addMemberUseCase.execute('org-123', {
				userId: 'user-123',
				role: 'member',
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockMembership);
			}
		});

		it('should add a member with admin role', async () => {
			const adminMembership = { ...mockMembership, role: 'admin' as const };
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(
				mockOrganization,
			);
			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(
				mockMembershipRepository.findByUserAndOrganization,
			).mockResolvedValue(null);
			vi.mocked(mockMembershipRepository.create).mockResolvedValue(
				adminMembership,
			);

			const result = await addMemberUseCase.execute('org-123', {
				userId: 'user-123',
				role: 'admin',
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.role).toBe('admin');
			}
		});
	});

	describe('execute - error cases', () => {
		it('should return error when organization not found', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

			const result = await addMemberUseCase.execute('non-existent-org', {
				userId: 'user-123',
				role: 'member',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(OrganizationNotFoundError);
			}
		});

		it('should return error when user not found', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(
				mockOrganization,
			);
			vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

			const result = await addMemberUseCase.execute('org-123', {
				userId: 'non-existent-user',
				role: 'member',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotFoundError);
			}
		});

		it('should return error when membership already exists', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(
				mockOrganization,
			);
			vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
			vi.mocked(
				mockMembershipRepository.findByUserAndOrganization,
			).mockResolvedValue(mockMembership);

			const result = await addMemberUseCase.execute('org-123', {
				userId: 'user-123',
				role: 'member',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MembershipAlreadyExistsError);
			}
		});
	});
});
