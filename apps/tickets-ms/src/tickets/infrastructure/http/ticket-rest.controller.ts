import {
	ApplicationError,
	ValidationError,
} from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
	Post,
	UnprocessableEntityException,
	UsePipes,
} from '@nestjs/common';
import {
	type CreateTicketDto,
	createTicketSchema,
} from '@tickets/application/dto/create-ticket.dto';
import {
	type UpdateTicketDto,
	updateTicketSchema,
} from '@tickets/application/dto/update-ticket.dto';
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

const VALID_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Done'];

@Controller('tickets')
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
	@UsePipes(new ZodValidationPipe(createTicketSchema))
	async createTicket(@Body() createTicketDto: CreateTicketDto) {
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
			}

			throw new InternalServerErrorException();
		}

		return { ticket: result.value };
	}

	@Get(':id')
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
	async getAllByOrganization(@Param('orgId') orgId: string) {
		const result = await this.getAllTicketsByOrgUseCase.execute(orgId);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Get('assignee/:assigneeId')
	async getByAssignee(@Param('assigneeId') assigneeId: string) {
		const result = await this.getTicketsByAssigneeUseCase.execute(assigneeId);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Get('status/:status')
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
	async getByTag(@Param('tag') tag: string) {
		const result = await this.getTicketsByTagUseCase.execute(tag);

		if (!result.ok) {
			throw new InternalServerErrorException();
		}

		return { tickets: result.value };
	}

	@Patch(':id')
	@UsePipes(new ZodValidationPipe(updateTicketSchema))
	async updateTicket(
		@Param('id') id: string,
		@Body() updateTicketDto: UpdateTicketDto,
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
