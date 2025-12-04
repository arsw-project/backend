import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============= WebSocket Event Documentation =============
// This file documents the WebSocket events for the video-call namespace
// Connect to: ws://localhost:3002/video-call

// ============= Client -> Server Events (Emit) =============

export class JoinRoomPayloadDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID del ticket para unirse a la sala',
	})
	ticketId: string;

	@ApiProperty({
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
		description: 'Token de sesión del usuario',
	})
	sessionToken: string;
}

export class SignalPayloadDto {
	@ApiProperty({
		example: 'socket-id-123',
		description: 'ID del socket destino',
	})
	targetSocketId: string;

	@ApiProperty({
		description: 'Datos de señalización WebRTC (SDP offer/answer)',
	})
	signal: object;
}

export class IceCandidatePayloadDto {
	@ApiProperty({
		example: 'socket-id-123',
		description: 'ID del socket destino',
	})
	targetSocketId: string;

	@ApiProperty({
		description: 'Candidato ICE para conexión peer-to-peer',
	})
	signal: object;
}

export class SendChatMessagePayloadDto {
	@ApiProperty({
		example: 'Hola a todos!',
		description: 'Contenido del mensaje de chat',
		maxLength: 2000,
	})
	content: string;
}

// ============= Server -> Client Events (Listen) =============

export class UserInfoDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID del usuario',
	})
	id: string;

	@ApiProperty({
		example: 'Juan Pérez',
		description: 'Nombre del usuario',
	})
	name: string;

	@ApiProperty({
		example: 'juan@example.com',
		description: 'Email del usuario',
	})
	email: string;

	@ApiPropertyOptional({
		example: 'https://example.com/avatar.jpg',
		description: 'URL del avatar del usuario',
	})
	picture?: string;
}

export class ParticipantDto {
	@ApiProperty({
		example: 'socket-id-123',
		description: 'ID del socket del participante',
	})
	socketId: string;

	@ApiProperty({
		type: UserInfoDto,
		description: 'Información del usuario',
	})
	user: UserInfoDto;
}

export class ChatMessageEventDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID único del mensaje',
	})
	id: string;

	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174001',
		description: 'ID del ticket',
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
		description: 'Nombre del usuario',
	})
	userName: string;

	@ApiProperty({
		example: 'Hola a todos!',
		description: 'Contenido del mensaje',
	})
	content: string;

	@ApiProperty({
		example: '2024-01-15T10:30:00.000Z',
		description: 'Fecha de creación en formato ISO 8601',
	})
	createdAt: string;
}

export class RoomJoinedEventDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID del ticket/sala',
	})
	ticketId: string;

	@ApiProperty({
		type: UserInfoDto,
		description: 'Información del usuario actual',
	})
	user: UserInfoDto;

	@ApiProperty({
		type: [ParticipantDto],
		description: 'Lista de otros participantes en la sala',
	})
	participants: ParticipantDto[];

	@ApiProperty({
		type: [ChatMessageEventDto],
		description: 'Historial de mensajes de chat de la sala',
	})
	chatHistory: ChatMessageEventDto[];
}

export class UserJoinedEventDto {
	@ApiProperty({
		example: 'socket-id-123',
		description: 'ID del socket del nuevo participante',
	})
	socketId: string;

	@ApiProperty({
		type: UserInfoDto,
		description: 'Información del usuario que se unió',
	})
	user: UserInfoDto;
}

export class UserLeftEventDto {
	@ApiProperty({
		example: 'socket-id-123',
		description: 'ID del socket del participante que salió',
	})
	socketId: string;

	@ApiProperty({
		type: UserInfoDto,
		description: 'Información del usuario que salió',
	})
	user: UserInfoDto;
}

export class RoomClosedEventDto {
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'ID del ticket/sala cerrada',
	})
	ticketId: string;

	@ApiProperty({
		example: 'INACTIVITY',
		description: 'Razón del cierre de la sala',
	})
	reason: string;

	@ApiProperty({
		example: 'Room closed due to inactivity',
		description: 'Mensaje descriptivo',
	})
	message: string;
}

export class ErrorEventDto {
	@ApiProperty({
		example: 'Invalid session',
		description: 'Mensaje de error',
	})
	message: string;

	@ApiProperty({
		example: 'UNAUTHORIZED',
		enum: ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_IN_ROOM', 'VALIDATION_ERROR'],
		description: 'Código del error',
	})
	code: string;

	@ApiPropertyOptional({
		description: 'Errores de validación detallados',
	})
	errors?: object[];
}

// ============= WebSocket Events Summary =============
/**
 * ## WebSocket Events - Video Call Namespace
 *
 * **Connection URL:** `ws://localhost:3002/video-call`
 *
 * ### Client -> Server Events (emit):
 * | Event              | Payload                    | Description                           |
 * |--------------------|----------------------------|---------------------------------------|
 * | `join-room`        | JoinRoomPayloadDto         | Unirse a una sala de video llamada    |
 * | `leave-room`       | (none)                     | Salir de la sala actual               |
 * | `offer`            | SignalPayloadDto           | Enviar oferta WebRTC                  |
 * | `answer`           | SignalPayloadDto           | Enviar respuesta WebRTC               |
 * | `ice-candidate`    | IceCandidatePayloadDto     | Enviar candidato ICE                  |
 * | `chat-message`     | SendChatMessagePayloadDto  | Enviar mensaje de chat                |
 * | `screen-share-started` | (none)                 | Notificar inicio de compartir pantalla|
 * | `screen-share-stopped` | (none)                 | Notificar fin de compartir pantalla   |
 *
 * ### Server -> Client Events (listen):
 * | Event              | Payload                    | Description                           |
 * |--------------------|----------------------------|---------------------------------------|
 * | `room-joined`      | RoomJoinedEventDto         | Confirmación de unión exitosa         |
 * | `room-left`        | { ticketId: string }       | Confirmación de salida                |
 * | `user-joined`      | UserJoinedEventDto         | Nuevo usuario se unió a la sala       |
 * | `user-left`        | UserLeftEventDto           | Usuario salió de la sala              |
 * | `room-closed`      | RoomClosedEventDto         | Sala cerrada por inactividad          |
 * | `offer`            | { senderSocketId, signal } | Oferta WebRTC recibida                |
 * | `answer`           | { senderSocketId, signal } | Respuesta WebRTC recibida             |
 * | `ice-candidate`    | { senderSocketId, signal } | Candidato ICE recibido                |
 * | `chat-message`     | ChatMessageEventDto        | Nuevo mensaje de chat                 |
 * | `screen-share-started` | { socketId: string }   | Usuario inició compartir pantalla     |
 * | `screen-share-stopped` | { socketId: string }   | Usuario detuvo compartir pantalla     |
 * | `error`            | ErrorEventDto              | Error en la operación                 |
 */
