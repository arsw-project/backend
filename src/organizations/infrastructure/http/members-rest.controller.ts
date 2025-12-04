import { User } from '@auth/infrastructure/decorators/user.decorator';
import { ApplicationError } from '@common/errors/application.error';
import {
	InternalServerErrorDto,
	NotFoundErrorDto,
	UnauthorizedErrorDto,
} from '@common/swagger/api-error.dto';
import {
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetMembersUseCase } from '@organizations/application/use-cases/get-members.case';
import { GetAllMembersResponseDto } from '@organizations/infrastructure/swagger/membership.swagger';
import type { SessionUserDto } from '@users/application/dto/session-user.dto';

@ApiTags('Members')
@ApiCookieAuth('session-token')
@Controller('members')
export class MembersRestController {
	constructor(private readonly getMembersUseCase: GetMembersUseCase) {}

	@Get()
	@ApiOperation({
		summary: 'Obtener miembros',
		description:
			'Retorna miembros según el rol del usuario. Si el usuario tiene rol system, retorna todos los usuarios del sistema. Si tiene otro rol, retorna solo los miembros de su organización.',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de miembros obtenida exitosamente',
		type: GetAllMembersResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'Usuario no autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Organización no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getMembers(@User() currentUser: SessionUserDto) {
		if (!currentUser) {
			throw new UnauthorizedException({
				message: 'Usuario no autenticado',
				code: 'UNAUTHORIZED',
			});
		}

		const result = await this.getMembersUseCase.execute(currentUser);

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
}
