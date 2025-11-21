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
		it('should delete organization successfully', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledWith('123');
			expect(repository.delete).toHaveBeenCalledTimes(1);
		});

		it('should handle deletion of non-existent organization', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('non-existent-id');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledWith('non-existent-id');
			expect(repository.delete).toHaveBeenCalledTimes(1);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			repository.delete.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('123')).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.delete).toHaveBeenCalledWith('123');
			expect(repository.delete).toHaveBeenCalledTimes(1);
		});

		it('should handle numeric id as string', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledWith('123');
		});

		it('should handle UUID format id', async () => {
			// Arrange
			const uuidId = '550e8400-e29b-41d4-a716-446655440000';
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(uuidId);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledWith(uuidId);
		});

		it('should handle empty string id', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledWith('');
		});

		it('should handle special characters in id', async () => {
			// Arrange
			const specialId = 'org-123!@#$%';
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute(specialId);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledWith(specialId);
		});

		it('should handle multiple deletions in sequence', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result1 = await useCase.execute('123');
			const result2 = await useCase.execute('456');
			const result3 = await useCase.execute('789');

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			expect(result3.ok).toBe(true);
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
			repository.delete.mockRejectedValue(constraintError);

			// Act & Assert
			await expect(useCase.execute('123')).rejects.toThrow(
				'Foreign key constraint violation',
			);
			expect(repository.delete).toHaveBeenCalledWith('123');
		});

		it('should return success result type', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result).toHaveProperty('ok');
			expect(result.ok).toBe(true);
		});

		it('should not call any other repository method', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			await useCase.execute('123');

			// Assert
			expect(repository.findAll).not.toHaveBeenCalled();
			expect(repository.findById).not.toHaveBeenCalled();
			expect(repository.findByName).not.toHaveBeenCalled();
			expect(repository.create).not.toHaveBeenCalled();
			expect(repository.update).not.toHaveBeenCalled();
		});

		it('should handle concurrent deletions', async () => {
			// Arrange
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
			expect(repository.delete).toHaveBeenCalledTimes(3);
		});

		it('should handle timeout errors', async () => {
			// Arrange
			const timeoutError = new Error('Query execution timeout');
			repository.delete.mockRejectedValue(timeoutError);

			// Act & Assert
			await expect(useCase.execute('123')).rejects.toThrow(
				'Query execution timeout',
			);
		});

		it('should be idempotent when called multiple times with same id', async () => {
			// Arrange
			repository.delete.mockResolvedValue(undefined);

			// Act
			const result1 = await useCase.execute('123');
			const result2 = await useCase.execute('123');

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			expect(repository.delete).toHaveBeenCalledTimes(2);
			expect(repository.delete).toHaveBeenNthCalledWith(1, '123');
			expect(repository.delete).toHaveBeenNthCalledWith(2, '123');
		});
	});
});
