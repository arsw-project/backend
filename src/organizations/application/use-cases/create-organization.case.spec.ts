import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { OrganizationConflictError } from '@organizations/application/errors/organization-conflict.error';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { CreateOrganizationUseCase } from './create-organization.case';

describe('CreateOrganizationUseCase', () => {
	let useCase: CreateOrganizationUseCase;
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

		useCase = new CreateOrganizationUseCase(repository);
	});

	describe('execute', () => {
		const validDto: CreateOrganizationDto = {
			name: 'Test Organization',
			description: 'Test Description',
		};

		const mockOrganization: Organization = {
			id: '123',
			name: 'Test Organization',
			description: 'Test Description',
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01'),
		};

		it('should create organization successfully when name is unique', async () => {
			// Arrange
			repository.findByName.mockResolvedValue(null);
			repository.create.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute(validDto);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockOrganization);
			}
			expect(repository.findByName).toHaveBeenCalledWith(validDto.name);
			expect(repository.findByName).toHaveBeenCalledTimes(1);
			expect(repository.create).toHaveBeenCalledWith(validDto);
			expect(repository.create).toHaveBeenCalledTimes(1);
		});

		it('should return conflict error when organization name already exists', async () => {
			// Arrange
			repository.findByName.mockResolvedValue(mockOrganization);

			// Act
			const result = await useCase.execute(validDto);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(OrganizationConflictError);
				expect(result.error.code).toBe('ORGANIZATION_CONFLICT');
				expect(result.error.issues).toHaveLength(1);
				expect(result.error.issues[0]).toEqual({
					code: 'custom',
					message: 'Organization name is already in use',
					path: ['name'],
				});
			}
			expect(repository.findByName).toHaveBeenCalledWith(validDto.name);
			expect(repository.findByName).toHaveBeenCalledTimes(1);
			expect(repository.create).not.toHaveBeenCalled();
		});

		it('should handle repository errors during name check', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			repository.findByName.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute(validDto)).rejects.toThrow(
				'Database connection failed',
			);
			expect(repository.findByName).toHaveBeenCalledWith(validDto.name);
			expect(repository.create).not.toHaveBeenCalled();
		});

		it('should handle repository errors during creation', async () => {
			// Arrange
			const dbError = new Error('Failed to create organization');
			repository.findByName.mockResolvedValue(null);
			repository.create.mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute(validDto)).rejects.toThrow(
				'Failed to create organization',
			);
			expect(repository.findByName).toHaveBeenCalledWith(validDto.name);
			expect(repository.create).toHaveBeenCalledWith(validDto);
		});

		it('should trim whitespace from name before checking uniqueness', async () => {
			// Arrange
			const dtoWithSpaces: CreateOrganizationDto = {
				name: '  Test Organization  ',
				description: 'Test Description',
			};
			repository.findByName.mockResolvedValue(null);
			repository.create.mockResolvedValue(mockOrganization);

			// Act
			await useCase.execute(dtoWithSpaces);

			// Assert
			expect(repository.findByName).toHaveBeenCalledWith(
				'  Test Organization  ',
			);
		});

		it('should create multiple organizations with different names', async () => {
			// Arrange
			const dto1: CreateOrganizationDto = {
				name: 'Organization 1',
				description: 'Description 1',
			};
			const dto2: CreateOrganizationDto = {
				name: 'Organization 2',
				description: 'Description 2',
			};

			repository.findByName.mockResolvedValue(null);
			repository.create
				.mockResolvedValueOnce({
					...mockOrganization,
					id: '1',
					name: dto1.name,
				})
				.mockResolvedValueOnce({
					...mockOrganization,
					id: '2',
					name: dto2.name,
				});

			// Act
			const result1 = await useCase.execute(dto1);
			const result2 = await useCase.execute(dto2);

			// Assert
			expect(result1.ok).toBe(true);
			expect(result2.ok).toBe(true);
			expect(repository.create).toHaveBeenCalledTimes(2);
		});
	});
});
