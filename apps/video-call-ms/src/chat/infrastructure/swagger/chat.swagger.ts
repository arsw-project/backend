import { ApiProperty } from '@nestjs/swagger';

// ============= Response DTOs =============

export class ChatMessageResponseDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID único del mensaje',
	})
	id: string;

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174001',
		description: 'ID del ticket al que pertenece el mensaje',
	})
	ticketId: string;

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174002',
		description: 'ID de la organización',
	})
	orgId: string;

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174003',
		description: 'ID del usuario que envió el mensaje',
	})
	userId: string;

	@ApiProperty({
		example: 'Juan Pérez',
		description: 'Nombre del usuario que envió el mensaje',
	})
	userName: string;

	@ApiProperty({
		example: 'Este es el contenido del mensaje de chat',
		description: 'Contenido del mensaje',
	})
	content: string;

	@ApiProperty({
		example: '2024-01-15T10:30:00.000Z',
		description: 'Fecha de creación del mensaje en formato ISO 8601',
	})
	createdAt: string;
}

export class PaginationDto {
	@ApiProperty({
		example: 100,
		description: 'Total de mensajes disponibles',
	})
	total: number;

	@ApiProperty({
		example: 50,
		description: 'Número máximo de mensajes por página',
	})
	limit: number;

	@ApiProperty({
		example: 0,
		description: 'Desplazamiento desde el inicio',
	})
	offset: number;

	@ApiProperty({
		example: true,
		description: 'Indica si hay más mensajes disponibles',
	})
	hasMore: boolean;
}

export class ChatHistoryResponseDto {
	@ApiProperty({
		type: [ChatMessageResponseDto],
		description: 'Lista de mensajes de chat',
	})
	data: ChatMessageResponseDto[];

	@ApiProperty({
		type: PaginationDto,
		description: 'Información de paginación',
	})
	pagination: PaginationDto;
}
