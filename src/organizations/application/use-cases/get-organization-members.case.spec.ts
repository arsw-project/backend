import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetOrganizationMembersUseCase } from './get-organization-members.case';

describe('GetOrganizationMembersUseCase', () => {
	let getOrganizationMembersUseCase: GetOrganizationMembersUseCase;
	let mockMembershipRepository: MembershipRepository;
	let mockOrganizationRepository: OrganizationRepository;

	const mockOrganization = {
		id: 'org-123',
		name: 'Test Org',
		description: 'Test Description',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockMemberships: Membership[] = [
		{
			id: 'membership-1',
			userId: 'user-1',
			organizationId: 'org-123',
			role: 'owner',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'membership-2',
			userId: 'user-2',
			organizationId: 'org-123',
			role: 'member',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

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

		getOrganizationMembersUseCase = new GetOrganizationMembersUseCase(
			mockMembershipRepository,
			mockOrganizationRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should return all members of an organization', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(
				mockOrganization,
			);
			vi.mocked(mockMembershipRepository.findByOrganization).mockResolvedValue(
				mockMemberships,
			);

			const result = await getOrganizationMembersUseCase.execute('org-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value).toEqual(mockMemberships);
			}
		});

		it('should return empty array when organization has no members', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(
				mockOrganization,
			);
			vi.mocked(mockMembershipRepository.findByOrganization).mockResolvedValue(
				[],
			);

			const result = await getOrganizationMembersUseCase.execute('org-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(0);
			}
		});
	});

	describe('execute - error cases', () => {
		it('should return error when organization not found', async () => {
			vi.mocked(mockOrganizationRepository.findById).mockResolvedValue(null);

			const result =
				await getOrganizationMembersUseCase.execute('non-existent');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(OrganizationNotFoundError);
			}
		});
	});
});
