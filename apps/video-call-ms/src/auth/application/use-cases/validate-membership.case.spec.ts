import { ExternalAuthPort } from '@auth/domain/ports/external-auth.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MembershipValidationError } from '../errors/auth.errors';
import { ValidateMembershipUseCase } from './validate-membership.case';

describe('ValidateMembershipUseCase', () => {
	let useCase: ValidateMembershipUseCase;
	let externalAuth: ExternalAuthPort;

	beforeEach(() => {
		externalAuth = {
			validateSession: vi.fn(),
			validateMembership: vi.fn(),
		} as unknown as ExternalAuthPort;

		useCase = new ValidateMembershipUseCase(externalAuth);
	});

	describe('execute', () => {
		it('should return membership result when user is a member', async () => {
			// Arrange
			vi.mocked(externalAuth.validateMembership).mockResolvedValue({
				isMember: true,
				orgId: 'org-123',
			});

			// Act
			const result = await useCase.execute('user-123', 'ticket-123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.isMember).toBe(true);
				expect(result.value.orgId).toBe('org-123');
			}
			expect(externalAuth.validateMembership).toHaveBeenCalledWith(
				'user-123',
				'ticket-123',
			);
			expect(externalAuth.validateMembership).toHaveBeenCalledTimes(1);
		});

		it('should return error when user is not a member', async () => {
			// Arrange
			vi.mocked(externalAuth.validateMembership).mockResolvedValue({
				isMember: false,
			});

			// Act
			const result = await useCase.execute('user-123', 'ticket-123');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MembershipValidationError);
				expect(result.error.code).toBe('MEMBERSHIP_VALIDATION_ERROR');
			}
		});

		it('should return error when orgId is missing', async () => {
			// Arrange
			vi.mocked(externalAuth.validateMembership).mockResolvedValue({
				isMember: true,
				orgId: undefined,
			});

			// Act
			const result = await useCase.execute('user-123', 'ticket-123');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MembershipValidationError);
			}
		});

		it('should include user and ticket in error message', async () => {
			// Arrange
			vi.mocked(externalAuth.validateMembership).mockResolvedValue({
				isMember: false,
			});

			// Act
			const result = await useCase.execute('specific-user', 'specific-ticket');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toContain('specific-user');
				expect(result.error.message).toContain('specific-ticket');
			}
		});

		it('should handle external auth service errors', async () => {
			// Arrange
			const serviceError = new Error('External service unavailable');
			vi.mocked(externalAuth.validateMembership).mockRejectedValue(
				serviceError,
			);

			// Act & Assert
			await expect(useCase.execute('user-123', 'ticket-123')).rejects.toThrow(
				'External service unavailable',
			);
		});

		it('should call external auth with correct parameters', async () => {
			// Arrange
			vi.mocked(externalAuth.validateMembership).mockResolvedValue({
				isMember: true,
				orgId: 'org-456',
			});

			// Act
			await useCase.execute('user-456', 'ticket-789');

			// Assert
			expect(externalAuth.validateMembership).toHaveBeenCalledWith(
				'user-456',
				'ticket-789',
			);
		});

		it('should return orgId in result when membership is valid', async () => {
			// Arrange
			vi.mocked(externalAuth.validateMembership).mockResolvedValue({
				isMember: true,
				orgId: 'organization-id-123',
			});

			// Act
			const result = await useCase.execute('user-123', 'ticket-123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.orgId).toBe('organization-id-123');
			}
		});
	});
});
