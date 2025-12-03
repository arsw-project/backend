import { error, ok, Result } from '@common/utility/results';
import { CreateTicketDto } from '@tickets/application/dto/create-ticket.dto';
import { TicketConflictError } from '@tickets/application/errors/ticket-conflict.error';
import { UserNotMemberError } from '@tickets/application/errors/user-not-member.error';
import { ValidationFailedError } from '@tickets/application/errors/validation-failed.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { ExternalValidationPort } from '@tickets/domain/ports/external-validation.port';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

export class CreateTicketUseCase {
	constructor(
		private readonly ticketRepository: TicketRepository,
		private readonly externalValidation: ExternalValidationPort,
	) {}

	async execute(
		createTicketDto: CreateTicketDto,
	): Promise<
		Result<
			Ticket,
			TicketConflictError | ValidationFailedError | UserNotMemberError
		>
	> {
		// First, validate that the user and organization exist in the monolith
		const validationResult =
			await this.externalValidation.validateUserAndOrganization(
				createTicketDto.createdBy,
				createTicketDto.orgId,
			);

		// If validation failed, clean up orphan tickets
		if (!validationResult.userExists || !validationResult.organizationExists) {
			let deletedUserTickets = 0;
			let deletedOrgTickets = 0;

			if (!validationResult.userExists) {
				deletedUserTickets = await this.ticketRepository.deleteByCreatorId(
					createTicketDto.createdBy,
				);
			}

			if (!validationResult.organizationExists) {
				deletedOrgTickets = await this.ticketRepository.deleteByOrganizationId(
					createTicketDto.orgId,
				);
			}

			return error(
				new ValidationFailedError(
					validationResult.userExists,
					validationResult.organizationExists,
					deletedUserTickets,
					deletedOrgTickets,
				),
			);
		}

		// Validate that the creator is a member of the organization
		const creatorIsMember = await this.externalValidation.validateMembership(
			createTicketDto.createdBy,
			createTicketDto.orgId,
		);

		if (!creatorIsMember) {
			return error(
				new UserNotMemberError(
					createTicketDto.createdBy,
					createTicketDto.orgId,
					'createdBy',
				),
			);
		}

		// Validate assignee membership if provided
		if (createTicketDto.assigneeId) {
			const assigneeIsMember = await this.externalValidation.validateMembership(
				createTicketDto.assigneeId,
				createTicketDto.orgId,
			);

			if (!assigneeIsMember) {
				return error(
					new UserNotMemberError(
						createTicketDto.assigneeId,
						createTicketDto.orgId,
						'assigneeId',
					),
				);
			}
		}

		// Check for title conflicts within the same organization
		const existingTickets = await this.ticketRepository.findAllByOrgId(
			createTicketDto.orgId,
		);

		const normalizedTitle = createTicketDto.title.trim().toLowerCase();
		const titleExists = existingTickets.some(
			(ticket) => ticket.title.trim().toLowerCase() === normalizedTitle,
		);

		if (titleExists) {
			const conflictError = new TicketConflictError();
			conflictError.addTitleConflictIssue();
			return error(conflictError);
		}

		const ticket = await this.ticketRepository.create(createTicketDto);
		return ok(ticket);
	}
}
