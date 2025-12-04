import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// =====================
// Request DTOs
// =====================

export class AddMemberRequestDto {
	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'ID del usuario a agregar',
		format: 'uuid',
	})
	userId: string;

	@ApiPropertyOptional({
		example: 'member',
		description: 'Rol del miembro en la organización',
		enum: ['owner', 'admin', 'member', 'viewer'],
		default: 'member',
	})
	role?: 'owner' | 'admin' | 'member' | 'viewer';
}

export class UpdateMemberRoleRequestDto {
	@ApiProperty({
		example: 'admin',
		description: 'Nuevo rol del miembro',
		enum: ['owner', 'admin', 'member', 'viewer'],
	})
	role: 'owner' | 'admin' | 'member' | 'viewer';
}

// =====================
// Response DTOs
// =====================

export class MemberUserResponseDto {
	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'ID del usuario',
	})
	id: string;

	@ApiProperty({
		example: 'John Doe',
		description: 'Nombre del usuario',
	})
	name: string;

	@ApiProperty({
		example: 'john@example.com',
		description: 'Email del usuario',
	})
	email: string;
}

export class MemberWithUserResponseDto {
	@ApiProperty({
		example: 'clxyz123abc456def789',
		description: 'ID único de la membresía',
	})
	id: string;

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'ID del usuario miembro',
	})
	userId: string;

	@ApiProperty({
		example: 'clxyz987zyx654wvu321',
		description: 'ID de la organización',
	})
	organizationId: string;

	@ApiProperty({
		example: 'member',
		description: 'Rol del miembro en la organización',
	})
	role: string;

	@ApiProperty({
		type: MemberUserResponseDto,
		description: 'Información del usuario',
	})
	user: MemberUserResponseDto;
}

export class GetAllMembersResponseDto {
	@ApiProperty({
		type: [MemberWithUserResponseDto],
		description:
			'Lista de miembros. Si el usuario es system, retorna todos los usuarios. Si no, retorna los miembros de su organización.',
	})
	members: MemberWithUserResponseDto[];
}

export class MembershipResponseDto {
	@ApiProperty({
		example: 'clxyz123abc456def789',
		description: 'ID único de la membresía',
	})
	id: string;

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'ID del usuario miembro',
	})
	userId: string;

	@ApiProperty({
		example: 'clxyz987zyx654wvu321',
		description: 'ID de la organización',
	})
	organizationId: string;

	@ApiProperty({
		example: 'member',
		description: 'Rol del miembro en la organización',
		enum: ['owner', 'admin', 'member', 'viewer'],
	})
	role: 'owner' | 'admin' | 'member' | 'viewer';

	@ApiProperty({
		example: '2024-01-15T10:30:00.000Z',
		description: 'Fecha de creación de la membresía',
	})
	createdAt: Date;

	@ApiProperty({
		example: '2024-01-15T10:30:00.000Z',
		description: 'Fecha de última actualización',
	})
	updatedAt: Date;
}

export class GetMembersResponseDto {
	@ApiProperty({
		type: [MembershipResponseDto],
		description: 'Lista de miembros de la organización',
	})
	members: MembershipResponseDto[];
}

export class AddMemberResponseDto {
	@ApiProperty({
		type: MembershipResponseDto,
		description: 'Membresía creada',
	})
	membership: MembershipResponseDto;
}

export class UpdateMemberRoleResponseDto {
	@ApiProperty({
		type: MembershipResponseDto,
		description: 'Membresía actualizada',
	})
	membership: MembershipResponseDto;
}
