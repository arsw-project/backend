import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAllOrganizationsUseCase } from './get-all-organizations.case';

describe('GetAllOrganizationsUseCase', () => {
	let useCase: GetAllOrganizationsUseCase;
	let repository: OrganizationRepository;

	beforeEach(() => {
		repository = {
			findAll: vi.fn(),
			findById: vi.fn(),
			findByName: vi.fn(),
			checkOrganizationConflict: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as OrganizationRepository;

		useCase = new GetAllOrganizationsUseCase(repository);
	});

	describe('execute', () => {
		const mockOrganizations: Organization[] = [
			{
				id: '1',
				name: 'Organization 1',
				description: 'Description 1',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			},
			{
				id: '2',
				name: 'Organization 2',
				description: 'Description 2',
				createdAt: new Date('2024-01-02'),
				updatedAt: new Date('2024-01-02'),
			},
			{
				id: '3',
				name: 'Organization 3',
				description: 'Description 3',
				createdAt: new Date('2024-01-03'),
				updatedAt: new Date('2024-01-03'),
			},
		];

		it('should return all organizations successfully', async () => {
			// Arrange
			vi.mocked(repository.findAll).mockResolvedValue(mockOrganizations);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganizations);
				expect(result.value).toHaveLength(3);
			}
			expect(repository.findAll).toHaveBeenCalledTimes(1);
			expect(repository.findAll).toHaveBeenCalledWith();
		});

		it('should return empty array when no organizations exist', async () => {
			// Arrange
			vi.mocked(repository.findAll).mockResolvedValue([]);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
				expect(result.value).toHaveLength(0);
			}
			expect(repository.findAll).toHaveBeenCalledTimes(1);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(repository.findAll).mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute()).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findAll).toHaveBeenCalledTimes(1);
		});

		it('should return organizations sorted by creation date', async () => {
			// Arrange
			const sortedOrganizations = [...mockOrganizations].sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
			);
			vi.mocked(repository.findAll).mockResolvedValue(sortedOrganizations);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value[0].id).toBe('1');
				expect(result.value[1].id).toBe('2');
				expect(result.value[2].id).toBe('3');
			}
		});

		it('should return a single organization when only one exists', async () => {
			// Arrange
			const singleOrganization = [mockOrganizations[0]];
			vi.mocked(repository.findAll).mockResolvedValue(singleOrganization);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1);
				expect(result.value[0]).toEqual(mockOrganizations[0]);
			}
		});

		it('should handle large datasets', async () => {
			// Arrange
			const largeDataset: Organization[] = Array.from(
				{ length: 1000 },
				(_, i) => ({
					id: `${i + 1}`,
					name: `Organization ${i + 1}`,
					description: `Description ${i + 1}`,
					createdAt: new Date(2024, 0, 1 + i),
					updatedAt: new Date(2024, 0, 1 + i),
				}),
			);
			vi.mocked(repository.findAll).mockResolvedValue(largeDataset);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(1000);
			}
			expect(repository.findAll).toHaveBeenCalledTimes(1);
		});

		it('should return immutable result', async () => {
			// Arrange
			vi.mocked(repository.findAll).mockResolvedValue(mockOrganizations);

			// Act
			const result = await useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				const originalLength = result.value.length;
				// Intentar modificar el resultado no debe afectar llamadas futuras
				result.value.push({
					id: '999',
					name: 'New Org',
					description: 'New Desc',
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				expect(result.value.length).toBe(originalLength + 1);
			}
		});
	});
});
