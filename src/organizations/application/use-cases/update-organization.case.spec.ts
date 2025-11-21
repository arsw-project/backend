import { UpdateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { OrganizationConflictError } from '@organizations/application/errors/organization-conflict.error';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { UpdateOrganizationUseCase } from './update-organization.case';

describe('UpdateOrganizationUseCase', () => {
	let useCase: UpdateOrganizationUseCase;
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

		useCase = new UpdateOrganizationUseCase(repository);
	});

	describe('execute', () => {
		const mockOrganization: Organization = {
			id: '123',
			name: 'Test Organization',
			description: 'Test Description',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		};

		const updatedOrganization: Organization = {
			...mockOrganization,
			name: 'Updated Organization',
			updatedAt: new Date('2024-01-02'),
		};

		it('should update organization successfully when no conflicts', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'Updated Organization',
				description: 'Updated Description',
			};
			repository.findByName.mockResolvedValue(null);
			repository.update.mockResolvedValue(updatedOrganization);

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(updatedOrganization);
			}
			expect(repository.findByName).toHaveBeenCalledWith(
				'Updated Organization',
			);
			expect(repository.update).toHaveBeenCalledWith('123', updateDto);
			expect(repository.findByName).toHaveBeenCalledTimes(1);
			expect(repository.update).toHaveBeenCalledTimes(1);
		});

		it('should update organization without checking name when name is not provided', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				description: 'Updated Description Only',
			};
			const updated = {
				...mockOrganization,
				description: updateDto.description ?? mockOrganization.description,
			};
			repository.update.mockResolvedValue(updated);

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.description).toBe('Updated Description Only');
			}
			expect(repository.findByName).not.toHaveBeenCalled();
			expect(repository.update).toHaveBeenCalledWith('123', updateDto);
		});

		it('should return conflict error when new name is already used by another organization', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'Existing Organization',
			};
			const existingOrg: Organization = {
				...mockOrganization,
				id: '456', // Different ID
				name: 'Existing Organization',
			};
			repository.findByName.mockResolvedValue(existingOrg);

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok && result.error) {
				expect(result.error).toBeInstanceOf(OrganizationConflictError);
				expect(result.error.code).toBe('ORGANIZATION_CONFLICT');
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0]).toEqual({
					code: 'custom',
					message: 'Organization name is already in use',
					path: ['name'],
				});
			}
			expect(repository.findByName).toHaveBeenCalledWith(
				'Existing Organization',
			);
			expect(repository.update).not.toHaveBeenCalled();
		});

		it('should allow updating organization with its own current name', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'Test Organization', // Same name
				description: 'Updated Description',
			};
			repository.findByName.mockResolvedValue(mockOrganization);
			repository.update.mockResolvedValue({
				...mockOrganization,
				description: 'Updated Description',
			});

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findByName).toHaveBeenCalledWith('Test Organization');
			expect(repository.update).toHaveBeenCalledWith('123', updateDto);
		});

		it('should return null when organization does not exist', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'Updated Name',
			};
			repository.findByName.mockResolvedValue(null);
			repository.update.mockResolvedValue(null);

			// Act
			const result = await useCase.execute('non-existent-id', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(repository.update).toHaveBeenCalledWith(
				'non-existent-id',
				updateDto,
			);
		});

		it('should handle partial updates (name only)', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'New Name Only',
			};
			repository.findByName.mockResolvedValue(null);
			repository.update.mockResolvedValue({
				...mockOrganization,
				name: 'New Name Only',
			});

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.name).toBe('New Name Only');
				expect(result.value?.description).toBe(mockOrganization.description);
			}
			expect(repository.findByName).toHaveBeenCalledWith('New Name Only');
		});

		it('should handle partial updates (description only)', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				description: 'New Description Only',
			};
			repository.update.mockResolvedValue({
				...mockOrganization,
				description: 'New Description Only',
			});

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value?.description).toBe('New Description Only');
				expect(result.value?.name).toBe(mockOrganization.name);
			}
			expect(repository.findByName).not.toHaveBeenCalled();
		});

		it('should handle repository errors during name check', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'New Name',
			};
			const dbError = new Error('Database connection failed');
			repository.findByName.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('123', updateDto)).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findByName).toHaveBeenCalledWith('New Name');
			expect(repository.update).not.toHaveBeenCalled();
		});

		it('should handle repository errors during update', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				description: 'New Description',
			};
			const dbError = new Error('Failed to update organization');
			repository.update.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('123', updateDto)).rejects.toThrow(
				'Failed to update organization',
			);
			expect(repository.update).toHaveBeenCalledWith('123', updateDto);
		});

		it('should handle empty update object', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {};
			repository.update.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			expect(repository.findByName).not.toHaveBeenCalled();
			expect(repository.update).toHaveBeenCalledWith('123', updateDto);
		});

		it('should trim whitespace from updated name', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: '  Updated Name  ',
			};
			repository.findByName.mockResolvedValue(null);
			repository.update.mockResolvedValue({
				...mockOrganization,
				name: '  Updated Name  ',
			});

			// Act
			await useCase.execute('123', updateDto);

			// Assert
			expect(repository.findByName).toHaveBeenCalledWith('  Updated Name  ');
		});

		it('should update timestamps correctly', async () => {
			// Arrange
			const updateDto: UpdateOrganizationDto = {
				name: 'Updated Name',
			};
			const now = new Date();
			repository.findByName.mockResolvedValue(null);
			repository.update.mockResolvedValue({
				...mockOrganization,
				name: 'Updated Name',
				updatedAt: now,
			});

			// Act
			const result = await useCase.execute('123', updateDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok && result.value) {
				expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
					mockOrganization.updatedAt.getTime(),
				);
			}
		});
	});
});
