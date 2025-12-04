import {
	CannotRemoveLastOwnerError,
	MembershipNotFoundError,
} from '@organizations/application/errors/membership.error';
import { Membership } from '@organizations/domain/entities/membership.entity';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateMemberRoleUseCase } from './update-member-role.case';

describe('UpdateMemberRoleUseCase', () => {
	let updateMemberRoleUseCase: UpdateMemberRoleUseCase;
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

		updateMemberRoleUseCase = new UpdateMemberRoleUseCase(
			mockMembershipRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should update member role successfully', async () => {
			const updatedMembership = { ...mockMembership, role: 'admin' as const };
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockMembership,
			);
			vi.mocked(mockMembershipRepository.update).mockResolvedValue(
				updatedMembership,
			);

			const result = await updateMemberRoleUseCase.execute('membership-123', {
				role: 'admin',
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.role).toBe('admin');
			}
		});

		it('should promote member to owner', async () => {
			const updatedMembership = { ...mockMembership, role: 'owner' as const };
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockMembership,
			);
			vi.mocked(mockMembershipRepository.update).mockResolvedValue(
				updatedMembership,
			);

			const result = await updateMemberRoleUseCase.execute('membership-123', {
				role: 'owner',
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.role).toBe('owner');
			}
		});

		it('should demote owner when there are multiple owners', async () => {
			const demotedMembership = {
				...mockOwnerMembership,
				role: 'admin' as const,
			};
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockOwnerMembership,
			);
			vi.mocked(
				mockMembershipRepository.countOwnersByOrganization,
			).mockResolvedValue(2);
			vi.mocked(mockMembershipRepository.update).mockResolvedValue(
				demotedMembership,
			);

			const result = await updateMemberRoleUseCase.execute('membership-owner', {
				role: 'admin',
			});

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.role).toBe('admin');
			}
		});
	});

	describe('execute - error cases', () => {
		it('should return error when membership not found', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(null);

			const result = await updateMemberRoleUseCase.execute('non-existent', {
				role: 'admin',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MembershipNotFoundError);
			}
		});

		it('should return error when demoting the last owner', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockOwnerMembership,
			);
			vi.mocked(
				mockMembershipRepository.countOwnersByOrganization,
			).mockResolvedValue(1);

			const result = await updateMemberRoleUseCase.execute('membership-owner', {
				role: 'member',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(CannotRemoveLastOwnerError);
			}
			expect(mockMembershipRepository.update).not.toHaveBeenCalled();
		});

		it('should return error when update returns null', async () => {
			vi.mocked(mockMembershipRepository.findById).mockResolvedValue(
				mockMembership,
			);
			vi.mocked(mockMembershipRepository.update).mockResolvedValue(null);

			const result = await updateMemberRoleUseCase.execute('membership-123', {
				role: 'admin',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MembershipNotFoundError);
			}
		});
	});
});
