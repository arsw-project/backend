import { Role } from '@auth/infrastructure/decorators/role.decorator';
import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	ConflictErrorDto,
	ForbiddenErrorDto,
	InternalServerErrorDto,
	NotFoundErrorDto,
	ValidationErrorResponseDto,
} from '@common/swagger/api-error.dto';
import {
	Body,
	ConflictException,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
	Post,
	UsePipes,
} from '@nestjs/common';
import {
	ApiBody,
	ApiConflictResponse,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
	type AddMemberDto,
	addMemberSchema,
	type UpdateMemberRoleDto,
	updateMemberRoleSchema,
} from '@organizations/application/dto/membership.dto';
import { AddMemberUseCase } from '@organizations/application/use-cases/add-member.case';
import { GetOrganizationMembersUseCase } from '@organizations/application/use-cases/get-organization-members.case';
import { RemoveMemberUseCase } from '@organizations/application/use-cases/remove-member.case';
import { UpdateMemberRoleUseCase } from '@organizations/application/use-cases/update-member-role.case';
import {
	AddMemberRequestDto,
	AddMemberResponseDto,
	GetMembersResponseDto,
	UpdateMemberRoleRequestDto,
	UpdateMemberRoleResponseDto,
} from '../swagger/membership.swagger';

@ApiTags('Memberships')
@Controller('organizations/:organizationId/members')
export class MembershipRestController {
	constructor(
		private readonly addMemberUseCase: AddMemberUseCase,
		private readonly removeMemberUseCase: RemoveMemberUseCase,
		private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
		private readonly getOrganizationMembersUseCase: GetOrganizationMembersUseCase,
	) {}

	@Get()
	@ApiOperation({
		summary: 'Listar miembros de una organización',
		description: 'Retorna todos los miembros de una organización específica',
	})
	@ApiParam({
		name: 'organizationId',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de miembros obtenida exitosamente',
		type: GetMembersResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Organización no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getMembers(@Param('organizationId') organizationId: string) {
		const result =
			await this.getOrganizationMembersUseCase.execute(organizationId);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'ORGANIZATION_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { members: result.value };
	}

	@Post()
	@UsePipes(new ZodValidationPipe(addMemberSchema))
	@HttpCode(HttpStatus.CREATED)
	@Role('admin')
	@ApiOperation({
		summary: 'Agregar miembro a una organización',
		description:
			'Agrega un usuario como miembro de la organización. Requiere rol de administrador.',
	})
	@ApiParam({
		name: 'organizationId',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiBody({ type: AddMemberRequestDto })
	@ApiResponse({
		status: 201,
		description: 'Miembro agregado exitosamente',
		type: AddMemberResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Organización o usuario no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiConflictResponse({
		description: 'El usuario ya es miembro de la organización',
		type: ConflictErrorDto,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Error de validación en los datos de entrada',
		type: ValidationErrorResponseDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async addMember(
		@Param('organizationId') organizationId: string,
		@Body() addMemberDto: AddMemberDto,
	) {
		const result = await this.addMemberUseCase.execute(
			organizationId,
			addMemberDto,
		);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'ORGANIZATION_NOT_FOUND':
				case 'USER_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
				case 'MEMBERSHIP_ALREADY_EXISTS':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error.issues,
					});
			}

			throw new InternalServerErrorException();
		}

		return { membership: result.value };
	}

	@Patch(':membershipId')
	@UsePipes(new ZodValidationPipe(updateMemberRoleSchema))
	@Role('admin')
	@ApiOperation({
		summary: 'Actualizar rol de un miembro',
		description:
			'Actualiza el rol de un miembro en la organización. Requiere rol de administrador.',
	})
	@ApiParam({
		name: 'organizationId',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiParam({
		name: 'membershipId',
		description: 'ID único de la membresía',
		example: 'clxyz123abc456def789',
	})
	@ApiBody({ type: UpdateMemberRoleRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Rol actualizado exitosamente',
		type: UpdateMemberRoleResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Membresía no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiForbiddenResponse({
		description: 'No se puede remover el rol del último propietario',
		type: ForbiddenErrorDto,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Error de validación en los datos de entrada',
		type: ValidationErrorResponseDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateMemberRole(
		@Param('membershipId') membershipId: string,
		@Body() updateDto: UpdateMemberRoleDto,
	) {
		const result = await this.updateMemberRoleUseCase.execute(
			membershipId,
			updateDto,
		);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'MEMBERSHIP_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
				case 'CANNOT_REMOVE_LAST_OWNER':
					throw new ForbiddenException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { membership: result.value };
	}

	@Delete(':membershipId')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Role('admin')
	@ApiOperation({
		summary: 'Remover miembro de una organización',
		description:
			'Elimina un miembro de la organización. Requiere rol de administrador.',
	})
	@ApiParam({
		name: 'organizationId',
		description: 'ID único de la organización',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiParam({
		name: 'membershipId',
		description: 'ID único de la membresía',
		example: 'clxyz123abc456def789',
	})
	@ApiResponse({
		status: 204,
		description: 'Miembro removido exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Membresía no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiForbiddenResponse({
		description: 'No se puede remover al último propietario de la organización',
		type: ForbiddenErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async removeMember(@Param('membershipId') membershipId: string) {
		const result = await this.removeMemberUseCase.execute(membershipId);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'MEMBERSHIP_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
				case 'CANNOT_REMOVE_LAST_OWNER':
					throw new ForbiddenException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}
	}
}
