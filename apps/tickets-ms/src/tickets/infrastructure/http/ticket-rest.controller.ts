import { AuthGuard } from '@auth/guards/auth.guard';
import {
	ApplicationError,
	ValidationError,
} from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	BadRequestErrorDto,
	ConflictErrorDto,
	ForbiddenErrorDto,
	InternalServerErrorDto,
	NotFoundErrorDto,
	UnauthorizedErrorDto,
	UnprocessableEntityErrorDto,
} from '@common/swagger/api-error.dto';
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
	Post,
	UnprocessableEntityException,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiConflictResponse,
	ApiCookieAuth,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
	type CreateTicketDto,
	createTicketSchema,
} from '@tickets/application/dto/create-ticket.dto';
import {
	type UpdateTicketDto,
	updateTicketSchema,
} from '@tickets/application/dto/update-ticket.dto';
import { UserNotMemberError } from '@tickets/application/errors/user-not-member.error';
import { ValidationFailedError } from '@tickets/application/errors/validation-failed.error';
import { CreateTicketUseCase } from '@tickets/application/use-cases/create-ticket.case';
import { DeleteTicketUseCase } from '@tickets/application/use-cases/delete-ticket.case';
import { GetAllTicketsByOrgUseCase } from '@tickets/application/use-cases/get-all-tickets-by-org.case';
import { GetTicketByIdUseCase } from '@tickets/application/use-cases/get-ticket-by-id.case';
import { GetTicketsByAssigneeUseCase } from '@tickets/application/use-cases/get-tickets-by-assignee.case';
import { GetTicketsByStatusUseCase } from '@tickets/application/use-cases/get-tickets-by-status.case';
import { GetTicketsByTagUseCase } from '@tickets/application/use-cases/get-tickets-by-tag.case';
import { UpdateAcceptanceCriteriaUseCase } from '@tickets/application/use-cases/update-acceptance-criteria.case';
import { UpdateTicketUseCase } from '@tickets/application/use-cases/update-ticket.case';
import { UpdateTicketAssigneeUseCase } from '@tickets/application/use-cases/update-ticket-assignee.case';
import { UpdateTicketStatusUseCase } from '@tickets/application/use-cases/update-ticket-status.case';
import type { TicketStatus } from '@tickets/domain/entities/ticket.entity';
import {
	CreateTicketRequestDto,
	DeleteTicketResponseDto,
	SingleTicketResponseDto,
	TicketListResponseDto,
	UpdateAcceptanceCriteriaRequestDto,
	UpdateAssigneeRequestDto,
	UpdateStatusRequestDto,
	UpdateTicketRequestDto,
} from '../swagger/ticket.swagger';

const VALID_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Done'];

@ApiTags('Tickets')
@ApiCookieAuth('session-token')
@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketRestController {
	constructor(
		private readonly createTicketUseCase: CreateTicketUseCase,
		private readonly getTicketByIdUseCase: GetTicketByIdUseCase,
		private readonly getAllTicketsByOrgUseCase: GetAllTicketsByOrgUseCase,
		private readonly getTicketsByAssigneeUseCase: GetTicketsByAssigneeUseCase,
		private readonly getTicketsByStatusUseCase: GetTicketsByStatusUseCase,
		private readonly getTicketsByTagUseCase: GetTicketsByTagUseCase,
		private readonly updateTicketUseCase: UpdateTicketUseCase,
		private readonly updateTicketStatusUseCase: UpdateTicketStatusUseCase,
		private readonly updateTicketAssigneeUseCase: UpdateTicketAssigneeUseCase,
		private readonly updateAcceptanceCriteriaUseCase: UpdateAcceptanceCriteriaUseCase,
		private readonly deleteTicketUseCase: DeleteTicketUseCase,
	) {}

	@Post()
	@ApiOperation({
		summary: 'Crear un nuevo ticket',
		description:
			'Crea un nuevo ticket en una organización. El creador y el asignado (si se especifica) deben ser miembros de la organización.',
	})
	@ApiBody({ type: CreateTicketRequestDto })
	@ApiResponse({
		status: 201,
		description: 'Ticket creado exitosamente',
		type: SingleTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado - Se requiere session token',
		type: UnauthorizedErrorDto,
	})
	@ApiForbiddenResponse({
		description: 'El usuario no es miembro de la organización',
		type: ForbiddenErrorDto,
	})
	@ApiConflictResponse({
		description: 'Conflicto al crear el ticket',
		type: ConflictErrorDto,
	})
	@ApiUnprocessableEntityResponse({
		description: 'Validación fallida - Usuario u organización no válidos',
		type: UnprocessableEntityErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async createTicket(
		@Body(new ZodValidationPipe(createTicketSchema))
		createTicketDto: CreateTicketDto,
	) {
		const result = await this.createTicketUseCase.execute(createTicketDto);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'TICKET_CONFLICT':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error instanceof ValidationError ? error.issues : undefined,
					});
				case 'VALIDATION_FAILED':
					if (error instanceof ValidationFailedError) {
						throw new UnprocessableEntityException({
							message: error.message,
							code: error.code,
							details: {
								userValid: error.userValid,
								organizationValid: error.organizationValid,
								deletedUserTickets: error.deletedUserTickets,
								deletedOrgTickets: error.deletedOrgTickets,
							},
						});
					}
					break;
				case 'USER_NOT_MEMBER':
					if (error instanceof UserNotMemberError) {
						throw new ForbiddenException({
							message: error.message,
							code: error.code,
							details: {
								userId: error.userId,
								organizationId: error.organizationId,
								field: error.field,
							},
						});
					}
					break;
			}

			throw new InternalServerErrorException();
		}

		return { ticket: result.value };
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener ticket por ID',
		description: 'Retorna un ticket específico por su ID único',
	})
	@ApiParam({
		name: 'id',
		description: 'ID único del ticket',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiResponse({
		status: 200,
		description: 'Ticket encontrado',
		type: SingleTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Ticket no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getById(@Param('id') id: string) {
		const result = await this.getTicketByIdUseCase.execute(id);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		if (!result.value) {
			throw new NotFoundException({
				message: `Ticket with id '${id}' was not found`,
				code: 'TICKET_NOT_FOUND',
			});
		}

		return { ticket: result.value };
	}

	@Get('organization/:orgId')
	@ApiOperation({
		summary: 'Obtener tickets por organización',
		description: 'Retorna todos los tickets de una organización específica',
	})
	@ApiParam({
		name: 'orgId',
		description: 'ID de la organización',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de tickets de la organización',
		type: TicketListResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getAllByOrganization(@Param('orgId') orgId: string) {
		const result = await this.getAllTicketsByOrgUseCase.execute(orgId);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Get('assignee/:assigneeId')
	@ApiOperation({
		summary: 'Obtener tickets por asignado',
		description: 'Retorna todos los tickets asignados a un usuario específico',
	})
	@ApiParam({
		name: 'assigneeId',
		description: 'ID del usuario asignado',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de tickets asignados al usuario',
		type: TicketListResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getByAssignee(@Param('assigneeId') assigneeId: string) {
		const result = await this.getTicketsByAssigneeUseCase.execute(assigneeId);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Get('status/:status')
	@ApiOperation({
		summary: 'Obtener tickets por estado',
		description: 'Retorna todos los tickets con un estado específico',
	})
	@ApiParam({
		name: 'status',
		description: 'Estado del ticket',
		enum: ['Open', 'In Progress', 'Done'],
		example: 'Open',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de tickets con el estado especificado',
		type: TicketListResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiBadRequestResponse({
		description: 'Estado inválido',
		type: BadRequestErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getByStatus(@Param('status') status: string) {
		if (!VALID_STATUSES.includes(status as TicketStatus)) {
			throw new BadRequestException({
				message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
				code: 'INVALID_STATUS',
			});
		}

		const result = await this.getTicketsByStatusUseCase.execute(
			status as TicketStatus,
		);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Get('tag/:tag')
	@ApiOperation({
		summary: 'Obtener tickets por etiqueta',
		description:
			'Retorna todos los tickets que contienen una etiqueta específica',
	})
	@ApiParam({
		name: 'tag',
		description: 'Etiqueta a buscar',
		example: 'backend',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de tickets con la etiqueta especificada',
		type: TicketListResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getByTag(@Param('tag') tag: string) {
		const result = await this.getTicketsByTagUseCase.execute(tag);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Actualizar ticket',
		description: 'Actualiza los campos de un ticket existente',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del ticket a actualizar',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiBody({ type: UpdateTicketRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Ticket actualizado exitosamente',
		type: SingleTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Ticket no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiConflictResponse({
		description: 'Conflicto al actualizar',
		type: ConflictErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateTicket(
		@Param('id') id: string,
		@Body(new ZodValidationPipe(updateTicketSchema))
		updateTicketDto: UpdateTicketDto,
	) {
		const result = await this.updateTicketUseCase.execute(id, updateTicketDto);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'TICKET_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
				case 'TICKET_CONFLICT':
					throw new ConflictException({
						message: error.message,
						code: error.code,
						errors: error instanceof ValidationError ? error.issues : undefined,
					});
			}

			throw new InternalServerErrorException();
		}

		return { ticket: result.value };
	}

	@Patch(':id/status')
	@ApiOperation({
		summary: 'Actualizar estado del ticket',
		description: 'Cambia el estado de un ticket (Open, In Progress, Done)',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del ticket',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiBody({ type: UpdateStatusRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Estado actualizado exitosamente',
		type: SingleTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiBadRequestResponse({
		description: 'Estado inválido',
		type: BadRequestErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Ticket no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateStatus(@Param('id') id: string, @Body('status') status: string) {
		if (!VALID_STATUSES.includes(status as TicketStatus)) {
			throw new BadRequestException({
				message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
				code: 'INVALID_STATUS',
			});
		}

		const result = await this.updateTicketStatusUseCase.execute(
			id,
			status as TicketStatus,
		);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'TICKET_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { ticket: result.value };
	}

	@Patch(':id/assignee')
	@ApiOperation({
		summary: 'Actualizar asignado del ticket',
		description:
			'Cambia el usuario asignado a un ticket. Pasar null para desasignar.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del ticket',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiBody({ type: UpdateAssigneeRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Asignado actualizado exitosamente',
		type: SingleTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Ticket no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateAssignee(
		@Param('id') id: string,
		@Body('assigneeId') assigneeId: string | null,
	) {
		const result = await this.updateTicketAssigneeUseCase.execute(
			id,
			assigneeId,
		);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'TICKET_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { ticket: result.value };
	}

	@Patch(':id/acceptance-criteria')
	@ApiOperation({
		summary: 'Actualizar criterios de aceptación',
		description: 'Reemplaza la lista de criterios de aceptación de un ticket',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del ticket',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiBody({ type: UpdateAcceptanceCriteriaRequestDto })
	@ApiResponse({
		status: 200,
		description: 'Criterios actualizados exitosamente',
		type: SingleTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Ticket no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async updateAcceptanceCriteria(
		@Param('id') id: string,
		@Body('acceptanceCriteria') acceptanceCriteria: string[],
	) {
		const result = await this.updateAcceptanceCriteriaUseCase.execute(
			id,
			acceptanceCriteria,
		);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'TICKET_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { ticket: result.value };
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Eliminar ticket',
		description: 'Elimina un ticket por su ID',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del ticket a eliminar',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiResponse({
		status: 200,
		description: 'Ticket eliminado exitosamente',
		type: DeleteTicketResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiNotFoundResponse({
		description: 'Ticket no encontrado',
		type: NotFoundErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async deleteTicket(@Param('id') id: string) {
		const result = await this.deleteTicketUseCase.execute(id);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'TICKET_NOT_FOUND':
					throw new NotFoundException({
						message: error.message,
						code: error.code,
					});
			}

			throw new InternalServerErrorException();
		}

		return { deleted: true };
	}
}
