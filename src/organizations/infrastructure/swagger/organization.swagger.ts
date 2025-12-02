import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// =====================
// Request DTOs
// =====================

export class CreateOrganizationRequestDto {
	@ApiProperty({
		example: 'Acme Corporation',
		description: 'Nombre de la organización',
		minLength: 1,
	})
	name: string;

	@ApiProperty({
		example: 'Empresa líder en tecnología e innovación',
		description: 'Descripción de la organización',
		minLength: 1,
	})
	description: string;
}

export class UpdateOrganizationRequestDto {
	@ApiPropertyOptional({
		example: 'Acme Corp',
		description: 'Nuevo nombre de la organización',
		minLength: 1,
	})
	name?: string;

	@ApiPropertyOptional({
		example: 'Nueva descripción actualizada',
		description: 'Nueva descripción de la organización',
		minLength: 1,
	})
	description?: string;
}

// =====================
// Response DTOs
// =====================

export class OrganizationResponseDto {
	@ApiProperty({
		example: 'clxyz123abc456def789',
		description: 'ID único de la organización',
	})
	id: string;

	@ApiProperty({
		example: 'Acme Corporation',
		description: 'Nombre de la organización',
	})
	name: string;

	@ApiProperty({
		example: 'Empresa líder en tecnología e innovación',
		description: 'Descripción de la organización',
	})
	description: string;

	@ApiProperty({
		example: '2024-01-15T10:30:00.000Z',
		description: 'Fecha de creación',
	})
	createdAt: Date;

	@ApiProperty({
		example: '2024-01-15T10:30:00.000Z',
		description: 'Fecha de última actualización',
	})
	updatedAt: Date;
}

export class GetAllOrganizationsResponseDto {
	@ApiProperty({
		type: [OrganizationResponseDto],
		description: 'Lista de organizaciones',
	})
	organizations: OrganizationResponseDto[];
}

export class GetOrganizationResponseDto {
	@ApiProperty({
		type: OrganizationResponseDto,
		description: 'Organización encontrada',
	})
	organization: OrganizationResponseDto;
}

export class CreateOrganizationResponseDto {
	@ApiProperty({
		type: OrganizationResponseDto,
		description: 'Organización creada',
	})
	organization: OrganizationResponseDto;
}

export class UpdateOrganizationResponseDto {
	@ApiProperty({
		type: OrganizationResponseDto,
		description: 'Organización actualizada',
	})
	organization: OrganizationResponseDto;
}
