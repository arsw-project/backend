import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetUserMembershipsUseCase } from './get-user-memberships.case';

describe('GetUserMembershipsUseCase', () => {
	let getUserMembershipsUseCase: GetUserMembershipsUseCase;
	let mockMembershipRepository: MembershipRepository;

	const mockMemberships: Membership[] = [
		{
			id: 'membership-1',
			userId: 'user-123',
			organizationId: 'org-1',
			role: 'owner',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'membership-2',
			userId: 'user-123',
			organizationId: 'org-2',
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

		getUserMembershipsUseCase = new GetUserMembershipsUseCase(
			mockMembershipRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should return all memberships for a user', async () => {
			vi.mocked(mockMembershipRepository.findByUser).mockResolvedValue(
				mockMemberships,
			);

			const result = await getUserMembershipsUseCase.execute('user-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value).toEqual(mockMemberships);
			}
		});

		it('should return empty array when user has no memberships', async () => {
			vi.mocked(mockMembershipRepository.findByUser).mockResolvedValue([]);

			const result = await getUserMembershipsUseCase.execute(
				'user-no-memberships',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(0);
			}
		});
	});
});
