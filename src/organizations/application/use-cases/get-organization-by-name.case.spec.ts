import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { GetOrganizationByNameUseCase } from './get-organization-by-name.case';

describe('GetOrganizationByNameUseCase', () => {
	let useCase: GetOrganizationByNameUseCase;
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

		useCase = new GetOrganizationByNameUseCase(repository);
	});

	describe('execute', () => {
		const mockOrganization: Organization = {
			id: '123',
			name: 'Test Organization',
			description: 'Test Description',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		};

		it('should return organization when found by name', async () => {
			// Arrange
			repository.findByName.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('Test Organization');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganization);
			}
			expect(repository.findByName).toHaveBeenCalledWith('Test Organization');
			expect(repository.findByName).toHaveBeenCalledTimes(1);
		});

		it('should return null when organization not found by name', async () => {
			// Arrange
			repository.findByName.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('Non-existent Organization');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(repository.findByName).toHaveBeenCalledWith(
				'Non-existent Organization',
			);
			expect(repository.findByName).toHaveBeenCalledTimes(1);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			repository.findByName.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('Test Organization')).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findByName).toHaveBeenCalledWith('Test Organization');
			expect(repository.findByName).toHaveBeenCalledTimes(1);
		});

		it('should handle name with special characters', async () => {
			// Arrange
			const specialName = 'Test & Organization #1';
			const orgWithSpecialName = { ...mockOrganization, name: specialName };
			repository.findByName.mockResolvedValue(orgWithSpecialName);

			// Act
			const result = await useCase.execute(specialName);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.name).toBe(specialName);
			}
			expect(repository.findByName).toHaveBeenCalledWith(specialName);
		});

		it('should handle name with whitespace', async () => {
			// Arrange
			const nameWithSpaces = '  Test Organization  ';
			repository.findByName.mockResolvedValue(null);

			// Act
			const result = await useCase.execute(nameWithSpaces);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findByName).toHaveBeenCalledWith(nameWithSpaces);
		});

		it('should handle empty string name', async () => {
			// Arrange
			repository.findByName.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(repository.findByName).toHaveBeenCalledWith('');
		});

		it('should handle very long organization names', async () => {
			// Arrange
			const longName = 'A'.repeat(500);
			const orgWithLongName = { ...mockOrganization, name: longName };
			repository.findByName.mockResolvedValue(orgWithLongName);

			// Act
			const result = await useCase.execute(longName);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.name).toBe(longName);
			}
			expect(repository.findByName).toHaveBeenCalledWith(longName);
		});

		it('should handle names with unicode characters', async () => {
			// Arrange
			const unicodeName = 'Organización Española 🇪🇸';
			const orgWithUnicode = { ...mockOrganization, name: unicodeName };
			repository.findByName.mockResolvedValue(orgWithUnicode);

			// Act
			const result = await useCase.execute(unicodeName);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.name).toBe(unicodeName);
			}
			expect(repository.findByName).toHaveBeenCalledWith(unicodeName);
		});

		it('should be case sensitive in search', async () => {
			// Arrange
			repository.findByName
				.mockResolvedValueOnce(mockOrganization)
				.mockResolvedValueOnce(null);

			// Act
			const result1 = await useCase.execute('Test Organization');
			const result2 = await useCase.execute('test organization');

			// Assert
			expect(result1.ok).toBe(true);
			if (result1.ok) {
				expect(result1.value).toEqual(mockOrganization);
			}
			expect(result2.ok).toBe(true);
			if (result2.ok) {
				expect(result2.value).toBeNull();
			}
			expect(repository.findByName).toHaveBeenNthCalledWith(
				1,
				'Test Organization',
			);
			expect(repository.findByName).toHaveBeenNthCalledWith(
				2,
				'test organization',
			);
		});

		it('should return organization with all fields populated', async () => {
			// Arrange
			repository.findByName.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('Test Organization');

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
	});
});
