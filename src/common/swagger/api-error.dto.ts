import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidationIssueDto {
	@ApiProperty({
		example: 'custom',
		description: 'Código del error de validación',
	})
	code: string;

	@ApiProperty({
		example: 'Email is already in use',
		description: 'Mensaje del error',
	})
	message: string;

	@ApiProperty({ example: ['email'], description: 'Ruta del campo con error' })
	path: string[];
}

export class ApiErrorDto {
	@ApiProperty({
		example: 'Validation failed',
		description: 'Mensaje de error',
	})
	message: string;

	@ApiProperty({
		example: 'USER_CONFLICT',
		description: 'Código de error interno',
	})
	code: string;

	@ApiPropertyOptional({
		type: [ValidationIssueDto],
		description: 'Lista de errores de validación',
	})
	errors?: ValidationIssueDto[];
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

	@ApiProperty({ example: 'Forbidden resource' })
	message: string;

	@ApiPropertyOptional({ example: 'CANNOT_REMOVE_LAST_OWNER' })
	code?: string;
}

export class NotFoundErrorDto {
	@ApiProperty({ example: 404 })
	statusCode: number;

	@ApiProperty({ example: 'Not Found' })
	message: string;

	@ApiPropertyOptional({ example: 'USER_NOT_FOUND' })
	code?: string;
}

export class ConflictErrorDto {
	@ApiProperty({ example: 409 })
	statusCode: number;

	@ApiProperty({ example: 'Resource already exists' })
	message: string;

	@ApiPropertyOptional({ example: 'USER_CONFLICT' })
	code?: string;

	@ApiPropertyOptional({
		type: [ValidationIssueDto],
		description: 'Lista de errores de conflicto',
	})
	errors?: ValidationIssueDto[];
}

export class ValidationErrorResponseDto {
	@ApiProperty({ example: 422 })
	statusCode: number;

	@ApiProperty({ example: 'Validation failed' })
	message: string;

	@ApiProperty({ example: 'VALIDATION_ERROR' })
	code: string;

	@ApiProperty({
		type: [ValidationIssueDto],
		description: 'Lista de errores de validación',
	})
	errors: ValidationIssueDto[];
}

export class InternalServerErrorDto {
	@ApiProperty({ example: 500 })
	statusCode: number;

	@ApiProperty({ example: 'Internal server error' })
	message: string;
}
