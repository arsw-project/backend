import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// =====================
// Request DTOs
// =====================

export class CreateUserRequestDto {
	@ApiProperty({
		example: 'John Doe',
		description: 'Nombre completo del usuario',
		minLength: 1,
	})
	name: string;

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

	@ApiProperty({
		example: 'local',
		description: 'Proveedor de autenticación',
		enum: ['local', 'google'],
	})
	authProvider: 'local' | 'google';

	@ApiProperty({
		example: null,
		description: 'ID del proveedor externo (null para local)',
		nullable: true,
	})
	providerId: string | null;
}

export class UpdateUserRequestDto {
	@ApiPropertyOptional({
		example: 'Jane Doe',
		description: 'Nuevo nombre del usuario',
		minLength: 1,
	})
	name?: string;

	@ApiPropertyOptional({
		example: 'jane.doe@example.com',
		description: 'Nuevo correo electrónico',
		format: 'email',
	})
	email?: string;

	@ApiPropertyOptional({
		example: 'NewSecurePassword456!',
		description: 'Nueva contraseña (mínimo 8 caracteres)',
		minLength: 8,
	})
	password?: string;

	@ApiPropertyOptional({
		example: 'admin',
		description: 'Nuevo rol del usuario',
		enum: ['user', 'admin', 'system'],
	})
	role?: 'user' | 'admin' | 'system';
}

// =====================
// Response DTOs
// =====================

export class UserResponseDto {
	@ApiProperty({
		example: 'clxyz123abc456def789',
		description: 'ID único del usuario',
	})
	id: string;

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
		enum: ['local', 'google'],
	})
	authProvider: 'local' | 'google';

	@ApiProperty({
		example: null,
		description: 'ID del proveedor externo',
		nullable: true,
	})
	providerId: string | null;

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

export class GetAllUsersResponseDto {
	@ApiProperty({ type: [UserResponseDto], description: 'Lista de usuarios' })
	users: UserResponseDto[];
}

export class GetUserResponseDto {
	@ApiProperty({ type: UserResponseDto, description: 'Usuario encontrado' })
	user: UserResponseDto;
}

export class CreateUserResponseDto {
	@ApiProperty({ type: UserResponseDto, description: 'Usuario creado' })
	user: UserResponseDto;
}

export class UpdateUserResponseDto {
	@ApiProperty({ type: UserResponseDto, description: 'Usuario actualizado' })
	user: UserResponseDto;
}
