import {error, ok, Result} from '@common/utility/results';
import {CreateTicketDto} from '@tickets/application/dto/create-ticket.dto';
import {TicketConflictError} from '@tickets/application/errors/ticket-conflict.error';
import {Ticket, TicketStatus} from '@tickets/domain/entities/ticket.entity';
import {TicketRepository} from '@tickets/domain/ports/ticket.repository.port';

const VALID_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Done'];

export class CreateTicketUseCase {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(
        createTicketDto: CreateTicketDto,
    ): Promise<Result<Ticket, TicketConflictError>> {
        const dto = {...createTicketDto};
        const conflictError = new TicketConflictError();

        const ticketsByOrgPromise = this.ticketRepository.findAllByOrgId(dto.orgId);
        const ticketsByAssigneePromise = dto.assigneeId
            ? this.ticketRepository.findByAssigneeId(dto.assigneeId)
            : Promise.resolve([]);

        const [ticketsByOrg, ticketsByAssignee] = await Promise.all([
            ticketsByOrgPromise,
            ticketsByAssigneePromise,
        ]);

        if (!VALID_STATUSES.includes(dto.status)) {
            conflictError.addInvalidStatusIssue();
        }

        if (dto.acceptanceCriteria.length === 0) {
            conflictError.addAcceptanceCriteriaConflictIssue();
        }

        const normalizedTitle = dto.title.trim().toLowerCase();
        if (
            ticketsByOrg.some(
                (ticket) => ticket.title.trim().toLowerCase() === normalizedTitle,
            )
        ) {
            conflictError.addTitleConflictIssue();
        }

        if (dto.tags.length === 0) {
            conflictError.addTagConflictIssue();
        } else {
            const normalizedTags = dto.tags.map((tag) => tag.trim().toLowerCase());
            const uniqueTags = new Set(normalizedTags);
            if (uniqueTags.size !== normalizedTags.length) {
                conflictError.addTagConflictIssue();
            }
        }

        if (dto.assigneeId && ticketsByAssignee.length > 0) {
            conflictError.addAssigneeConflictIssue();

            const belongsToOtherOrg = ticketsByAssignee.some(
                (ticket) => ticket.orgId !== dto.orgId,
            );
            if (belongsToOtherOrg) {
                conflictError.addOrganizationMismatchIssue();
            }
        }

        if (conflictError.issues.length > 0) {
            return error(conflictError);
        }

        const ticket = await this.ticketRepository.create(dto);
        return ok(ticket);
    }
}