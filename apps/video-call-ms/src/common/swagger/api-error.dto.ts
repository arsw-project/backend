import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnauthorizedErrorDto {
	@ApiProperty({ example: 401 })
	statusCode: number;

	@ApiProperty({ example: 'Unauthorized' })
	message: string;
}

export class NotFoundErrorDto {
	@ApiProperty({ example: 404 })
	statusCode: number;

	@ApiProperty({ example: 'Chat history not found' })
	message: string;

	@ApiPropertyOptional({ example: 'NOT_FOUND' })
	code?: string;
}

export class BadRequestErrorDto {
	@ApiProperty({ example: 400 })
	statusCode: number;

	@ApiProperty({ example: 'Invalid ticket ID format' })
	message: string;

	@ApiPropertyOptional({ example: 'BAD_REQUEST' })
	code?: string;
}

export class InternalServerErrorDto {
	@ApiProperty({ example: 500 })
	statusCode: number;

	@ApiProperty({ example: 'Internal server error' })
	message: string;
}
