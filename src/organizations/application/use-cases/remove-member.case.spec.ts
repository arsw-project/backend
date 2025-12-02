import {
	CannotRemoveLastOwnerError,
	MembershipNotFoundError,
} from '@organizations/application/errors/membership.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoveMemberUseCase } from './remove-member.case';

describe('RemoveMemberUseCase', () => {
	let removeMemberUseCase: RemoveMemberUseCase;
	let mockMembershipRepository: MembershipRepository;

	const mockMembership: Membership = {
		id: 'membership-123',
		userId: 'user-123',
		organizationId: 'org-123',
		role: 'member',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockOwnerMembership: Membership = {
		id: 'membership-owner',
		userId: 'user-owner',
		organizationId: 'org-123',
		role: 'owner',
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

		removeMemberUseCase = new RemoveMemberUseCase(mockMembershipRepository);
	});

	describe('execute - success cases', () => {
		it('should remove a member successfully', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockMembership,
			);
			vi.mocked(mockMembershipRepository.delete).mockResolvedValue(undefined);

			const result = await removeMemberUseCase.execute('membership-123');

			expect(result.ok).toBe(true);
			expect(mockMembershipRepository.delete).toHaveBeenCalledWith(
				'membership-123',
			);
		});

		it('should remove an owner when there are multiple owners', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockOwnerMembership,
			);
			vi.mocked(
				mockMembershipRepository.countOwnersByOrganization,
			).mockResolvedValue(2);
			vi.mocked(mockMembershipRepository.delete).mockResolvedValue(undefined);

			const result = await removeMemberUseCase.execute('membership-owner');

			expect(result.ok).toBe(true);
			expect(mockMembershipRepository.delete).toHaveBeenCalledWith(
				'membership-owner',
			);
		});
	});

	describe('execute - error cases', () => {
		it('should return error when membership not found', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(null);

			const result = await removeMemberUseCase.execute('non-existent');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MembershipNotFoundError);
			}
		});

		it('should return error when trying to remove the last owner', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockOwnerMembership,
			);
			vi.mocked(
				mockMembershipRepository.countOwnersByOrganization,
			).mockResolvedValue(1);

			const result = await removeMemberUseCase.execute('membership-owner');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(CannotRemoveLastOwnerError);
			}
			expect(mockMembershipRepository.delete).not.toHaveBeenCalled();
		});
	});
});
