import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============= Request DTOs =============

export class CreateTicketRequestDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID de la organización a la que pertenece el ticket',
	})
	orgId: string;

	@ApiProperty({
		example: 'Implementar autenticación OAuth',
		description: 'Título del ticket',
	})
	title: string;

	@ApiProperty({
		example: 'Implementar flujo de autenticación con Google OAuth 2.0',
		description: 'Descripción detallada del ticket',
	})
	description: string;

	@ApiPropertyOptional({
		example: [
			'El usuario puede iniciar sesión con Google',
			'Se almacena la sesión en cookies',
		],
		description: 'Lista de criterios de aceptación',
		default: [],
	})
	acceptanceCriteria?: string[];

	@ApiPropertyOptional({
		example: 'Open',
		enum: ['Open', 'In Progress', 'Done'],
		description: 'Estado del ticket',
		default: 'Open',
	})
	status?: string;

	@ApiPropertyOptional({
		example: '123e4567-e89b-12d3-a456-426614174001',
		description: 'ID del usuario asignado al ticket (puede ser null)',
		nullable: true,
	})
	assigneeId?: string | null;

	@ApiProperty({
		example: 'M',
		enum: ['S', 'M', 'L'],
		description: 'Dificultad del ticket (S=Small, M=Medium, L=Large)',
	})
	difficulty: string;

	@ApiPropertyOptional({
		example: ['backend', 'auth', 'priority-high'],
		description: 'Etiquetas del ticket',
		default: [],
	})
	tags?: string[];

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174002',
		description: 'ID del usuario que crea el ticket',
	})
	createdBy: string;
}

export class UpdateTicketRequestDto {
	@ApiPropertyOptional({
		example: 'Implementar autenticación OAuth v2',
		description: 'Nuevo título del ticket',
	})
	title?: string;

	@ApiPropertyOptional({
		example: 'Implementar flujo de autenticación con Google OAuth 2.0 y GitHub',
		description: 'Nueva descripción del ticket',
	})
	description?: string;

	@ApiPropertyOptional({
		example: [
			'El usuario puede iniciar sesión con Google',
			'El usuario puede iniciar sesión con GitHub',
		],
		description: 'Nueva lista de criterios de aceptación',
	})
	acceptanceCriteria?: string[];

	@ApiPropertyOptional({
		example: 'In Progress',
		enum: ['Open', 'In Progress', 'Done'],
		description: 'Nuevo estado del ticket',
	})
	status?: string;

	@ApiPropertyOptional({
		example: '123e4567-e89b-12d3-a456-426614174001',
		description: 'ID del nuevo usuario asignado',
		nullable: true,
	})
	assigneeId?: string | null;

	@ApiPropertyOptional({
		example: 'L',
		enum: ['S', 'M', 'L'],
		description: 'Nueva dificultad del ticket',
	})
	difficulty?: string;

	@ApiPropertyOptional({
		example: ['backend', 'auth', 'priority-critical'],
		description: 'Nuevas etiquetas del ticket',
	})
	tags?: string[];
}

export class UpdateStatusRequestDto {
	@ApiProperty({
		example: 'In Progress',
		enum: ['Open', 'In Progress', 'Done'],
		description: 'Nuevo estado del ticket',
	})
	status: string;
}

export class UpdateAssigneeRequestDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174001',
		description: 'ID del usuario a asignar (null para desasignar)',
		nullable: true,
	})
	assigneeId: string | null;
}

export class UpdateAcceptanceCriteriaRequestDto {
	@ApiProperty({
		example: ['Criterio 1', 'Criterio 2', 'Criterio 3'],
		description: 'Nueva lista de criterios de aceptación',
		type: [String],
	})
	acceptanceCriteria: string[];
}

// ============= Response DTOs =============

export class TicketResponseDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID único del ticket',
	})
	id: string;

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174001',
		description: 'ID de la organización',
	})
	orgId: string;

	@ApiProperty({
		example: 'Implementar autenticación OAuth',
		description: 'Título del ticket',
	})
	title: string;

	@ApiProperty({
		example: 'Implementar flujo de autenticación con Google OAuth 2.0',
		description: 'Descripción del ticket',
	})
	description: string;

	@ApiProperty({
		example: ['El usuario puede iniciar sesión con Google'],
		description: 'Criterios de aceptación',
		type: [String],
	})
	acceptanceCriteria: string[];

	@ApiProperty({
		example: 'Open',
		enum: ['Open', 'In Progress', 'Done'],
		description: 'Estado actual del ticket',
	})
	status: string;

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174002',
		description: 'ID del usuario asignado (puede ser null)',
		nullable: true,
	})
	assigneeId: string | null;

	@ApiProperty({
		example: 'M',
		enum: ['S', 'M', 'L'],
		description: 'Dificultad del ticket',
	})
	difficulty: string;

	@ApiProperty({
		example: ['backend', 'auth'],
		description: 'Etiquetas del ticket',
		type: [String],
	})
	tags: string[];

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174003',
		description: 'ID del creador del ticket',
	})
	createdBy: string;

	@ApiProperty({
		example: '2025-01-15T10:30:00.000Z',
		description: 'Fecha de creación',
	})
	createdAt: Date;

	@ApiProperty({
		example: '2025-01-15T14:45:00.000Z',
		description: 'Fecha de última actualización',
	})
	updatedAt: Date;
}

export class SingleTicketResponseDto {
	@ApiProperty({
		type: TicketResponseDto,
		description: 'Datos del ticket',
	})
	ticket: TicketResponseDto;
}

export class TicketListResponseDto {
	@ApiProperty({
		type: [TicketResponseDto],
		description: 'Lista de tickets',
	})
	tickets: TicketResponseDto[];
}

export class DeleteTicketResponseDto {
	@ApiProperty({
		example: true,
		description: 'Indica si el ticket fue eliminado exitosamente',
	})
	deleted: boolean;
}
