import { ApiProperty } from '@nestjs/swagger';

// =====================
// Request DTOs
// =====================

export class LoginRequestDto {
	@ApiProperty({
		example: 'john.doe@example.com',
		description: 'Correo electrónico del usuario',
		format: 'email',
	})
	email: string;

	@ApiProperty({
		example: 'SecurePassword123!',
		description: 'Contraseña del usuario',
		minLength: 1,
	})
	password: string;
}

// =====================
// Response DTOs
// =====================

export class SessionUserResponseDto {
	@ApiProperty({ example: 'John Doe', description: 'Nombre del usuario' })
	name: string;

	@ApiProperty({
		example: 'john.doe@example.com',
		description: 'Correo electrónico',
	})
	email: string;

	@ApiProperty({
		example: 'local',
		description: 'Proveedor de autenticación',
	})
	authProvider: string;

	@ApiProperty({
		example: 'user',
		description: 'Rol del usuario',
		enum: ['user', 'admin', 'system'],
	})
	role: 'user' | 'admin' | 'system';

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

export class GetProfileResponseDto {
	@ApiProperty({
		type: SessionUserResponseDto,
		description: 'Información del usuario autenticado',
	})
	user: SessionUserResponseDto;
}

export class LoginResponseDto {
	@ApiProperty({
		type: SessionUserResponseDto,
		description: 'Usuario autenticado',
	})
	user: SessionUserResponseDto;
}

export class LogoutResponseDto {
	@ApiProperty({
		example: 'Logged out successfully',
		description: 'Mensaje de confirmación',
	})
	message: string;
}
