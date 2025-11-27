import { OrganizationNotFoundError } from '@organizations/application/errors/organization-not-found.error';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { DeleteOrganizationUseCase } from './delete-organization.case';

describe('DeleteOrganizationUseCase', () => {
	let useCase: DeleteOrganizationUseCase;
	let repository: jest.Mocked<OrganizationRepository>;

	beforeEach(() => {
		repository = {
			findAll: jest.fn(),
			findById: jest.fn(),
			findByName: jest.fn(),
			checkOrganizationConflict: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		useCase = new DeleteOrganizationUseCase(repository);
	});

	describe('execute', () => {
		const mockOrganization: Organization = {
			id: '123',
			name: 'Test Organization',
			description: 'Test Description',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		};

		it('should delete organization successfully', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(repository.delete).toHaveBeenCalledWith('123');
		});

		it('should return not found error when organization does not exist', async () => {
			// Arrange
			repository.findById.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('non-existent-id');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(OrganizationNotFoundError);
				expect(result.error.code).toBe('ORGANIZATION_NOT_FOUND');
			}
			expect(repository.findById).toHaveBeenCalledWith('non-existent-id');
			expect(repository.delete).not.toHaveBeenCalled();
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			repository.findById.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('123')).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(repository.delete).not.toHaveBeenCalled();
		});

		it('should handle numeric id as string', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(repository.delete).toHaveBeenCalledWith('123');
		});

		it('should handle UUID format id', async () => {
			// Arrange
			const uuidId = '550e8400-e29b-41d4-a716-446655440000';
			const orgWithUuid = { ...mockOrganization, id: uuidId };
			repository.findById.mockResolvedValue(orgWithUuid);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(uuidId);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledWith(uuidId);
			expect(repository.delete).toHaveBeenCalledWith(uuidId);
		});

		it('should return not found error for empty string id', async () => {
			// Arrange
			repository.findById.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(OrganizationNotFoundError);
			}
			expect(repository.findById).toHaveBeenCalledWith('');
		});

		it('should handle special characters in id', async () => {
			// Arrange
			const specialId = 'org-123!@#$%';
			const orgWithSpecialId = { ...mockOrganization, id: specialId };
			repository.findById.mockResolvedValue(orgWithSpecialId);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(specialId);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledWith(specialId);
			expect(repository.delete).toHaveBeenCalledWith(specialId);
		});

		it('should handle multiple deletions in sequence', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result1 = await useCase.execute('123');
			const result2 = await useCase.execute('456');
			const result3 = await useCase.execute('789');

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			expect(result3.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledTimes(3);
			expect(repository.delete).toHaveBeenCalledTimes(3);
			expect(repository.delete).toHaveBeenNthCalledWith(1, '123');
			expect(repository.delete).toHaveBeenNthCalledWith(2, '456');
			expect(repository.delete).toHaveBeenNthCalledWith(3, '789');
		});

		it('should handle foreign key constraint errors', async () => {
			// Arrange
			const constraintError = new Error(
				'Foreign key constraint violation: Organization has related records',
			);
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockRejectedValue(constraintError);

			// Act & Assert
			await expect(useCase.execute('123')).rejects.toThrow(
				'Foreign key constraint violation',
			);
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(repository.delete).toHaveBeenCalledWith('123');
		});

		it('should return success result type', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result).toHaveProperty('ok');
			expect(result.ok).toBe(true);
		});

		it('should call findById and delete, but not other repository methods', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			await useCase.execute('123');

			// Assert
			expect(repository.findAll).not.toHaveBeenCalled();
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(repository.findByName).not.toHaveBeenCalled();
			expect(repository.create).not.toHaveBeenCalled();
			expect(repository.update).not.toHaveBeenCalled();
			expect(repository.delete).toHaveBeenCalledWith('123');
		});

		it('should handle concurrent deletions', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const results = await Promise.all([
				useCase.execute('123'),
				useCase.execute('456'),
				useCase.execute('789'),
			]);

			// Assert
			expect(results).toHaveLength(3);
			results.forEach((result) => {
				expect(result.ok).toBe(true);
			});
			expect(repository.findById).toHaveBeenCalledTimes(3);
			expect(repository.delete).toHaveBeenCalledTimes(3);
		});

		it('should handle timeout errors', async () => {
			// Arrange
			const timeoutError = new Error('Query execution timeout');
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockRejectedValue(timeoutError);

			// Act & Assert
			await expect(useCase.execute('123')).rejects.toThrow(
				'Query execution timeout',
			);
			expect(repository.findById).toHaveBeenCalledWith('123');
		});

		it('should be idempotent when called multiple times with same id', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result1 = await useCase.execute('123');
			const result2 = await useCase.execute('123');

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledTimes(2);
			expect(repository.delete).toHaveBeenCalledTimes(2);
			expect(repository.delete).toHaveBeenNthCalledWith(1, '123');
			expect(repository.delete).toHaveBeenNthCalledWith(2, '123');
		});
	});
});
