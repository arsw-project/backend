import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidationIssueDto {
	@ApiProperty({
		example: 'custom',
		description: 'Código del error de validación',
	})
	code: string;

	@ApiProperty({
		example: 'Title is required',
		description: 'Mensaje del error',
	})
	message: string;

	@ApiProperty({ example: ['title'], description: 'Ruta del campo con error' })
	path: string[];
}

export class UnauthorizedErrorDto {
	@ApiProperty({ example: 401 })
	statusCode: number;

	@ApiProperty({ example: 'Unauthorized' })
	message: string;
}

export class ForbiddenErrorDto {
	@ApiProperty({ example: 403 })
	statusCode: number;

	@ApiProperty({ example: 'User is not a member of the organization' })
	message: string;

	@ApiPropertyOptional({ example: 'USER_NOT_MEMBER' })
	code?: string;

	@ApiPropertyOptional({
		example: {
			userId: '123e4567-e89b-12d3-a456-426614174000',
			organizationId: '123e4567-e89b-12d3-a456-426614174001',
			field: 'createdBy',
		},
	})
	details?: object;
}

export class NotFoundErrorDto {
	@ApiProperty({ example: 404 })
	statusCode: number;

	@ApiProperty({ example: 'Ticket not found' })
	message: string;

	@ApiPropertyOptional({ example: 'TICKET_NOT_FOUND' })
	code?: string;
}

export class ConflictErrorDto {
	@ApiProperty({ example: 409 })
	statusCode: number;

	@ApiProperty({ example: 'Ticket already exists' })
	message: string;

	@ApiPropertyOptional({ example: 'TICKET_CONFLICT' })
	code?: string;

	@ApiPropertyOptional({
		type: [ValidationIssueDto],
		description: 'Lista de errores de conflicto',
	})
	errors?: ValidationIssueDto[];
}

export class UnprocessableEntityErrorDto {
	@ApiProperty({ example: 422 })
	statusCode: number;

	@ApiProperty({ example: 'Validation failed' })
	message: string;

	@ApiProperty({ example: 'VALIDATION_FAILED' })
	code: string;

	@ApiPropertyOptional({
		example: {
			userValid: false,
			organizationValid: true,
			deletedUserTickets: 0,
			deletedOrgTickets: 0,
		},
	})
	details?: object;
}

export class BadRequestErrorDto {
	@ApiProperty({ example: 400 })
	statusCode: number;

	@ApiProperty({
		example: 'Invalid status. Must be one of: Open, In Progress, Done',
	})
	message: string;

	@ApiPropertyOptional({ example: 'INVALID_STATUS' })
	code?: string;
}

export class InternalServerErrorDto {
	@ApiProperty({ example: 500 })
	statusCode: number;

	@ApiProperty({ example: 'Internal server error' })
	message: string;
}
