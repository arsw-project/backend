import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { GetOrganizationByIdUseCase } from './get-organization-by-id.case';

describe('GetOrganizationByIdUseCase', () => {
	let useCase: GetOrganizationByIdUseCase;
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

		useCase = new GetOrganizationByIdUseCase(repository);
	});

	describe('execute', () => {
		const mockOrganization: Organization = {
			id: '123',
			name: 'Test Organization',
			description: 'Test Description',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		};

		it('should return organization when found by id', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganization);
			}
			expect(repository.findById).toHaveBeenCalledWith('123');
			expect(repository.findById).toHaveBeenCalledTimes(1);
		});

		it('should return null when organization not found', async () => {
			// Arrange
			repository.findById.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('non-existent-id');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(repository.findById).toHaveBeenCalledWith('non-existent-id');
			expect(repository.findById).toHaveBeenCalledTimes(1);
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
			expect(repository.findById).toHaveBeenCalledTimes(1);
		});

		it('should handle numeric id as string', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledWith('123');
		});

		it('should handle UUID format id', async () => {
			// Arrange
			const uuidId = '550e8400-e29b-41d4-a716-446655440000';
			const orgWithUuid = { ...mockOrganization, id: uuidId };
			repository.findById.mockResolvedValue(orgWithUuid);

			// Act
			const result = await useCase.execute(uuidId);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.id).toBe(uuidId);
			}
			expect(repository.findById).toHaveBeenCalledWith(uuidId);
		});

		it('should handle empty string id', async () => {
			// Arrange
			repository.findById.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(repository.findById).toHaveBeenCalledWith('');
		});

		it('should handle special characters in id', async () => {
			// Arrange
			const specialId = 'org-123!@#$%';
			repository.findById.mockResolvedValue(null);

			// Act
			const result = await useCase.execute(specialId);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findById).toHaveBeenCalledWith(specialId);
		});

		it('should return organization with all fields populated', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok && result.value) {
				expect(result.value.id).toBeDefined();
				expect(result.value.name).toBeDefined();
				expect(result.value.description).toBeDefined();
				expect(result.value.createdAt).toBeInstanceOf(Date);
				expect(result.value.updatedAt).toBeInstanceOf(Date);
			}
		});

		it('should call repository only once per execution', async () => {
			// Arrange
			repository.findById.mockResolvedValue(mockOrganization);

			// Act
			await useCase.execute('123');
			await useCase.execute('456');

			// Assert
			expect(repository.findById).toHaveBeenCalledTimes(2);
			expect(repository.findById).toHaveBeenNthCalledWith(1, '123');
			expect(repository.findById).toHaveBeenNthCalledWith(2, '456');
		});
	});
});
