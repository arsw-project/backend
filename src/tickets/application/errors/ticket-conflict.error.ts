import {ValidationError} from '@common/errors/application.error';

export class TicketAssigneeConflictError extends ValidationError {
    public readonly code = 'TICKET_ASSIGNEE_CONFLICT';

    constructor() {
        super('Ticket assignee conflict error', [
            {
                code: 'custom',
                message: 'Ticket has already been assigned to a user',
                path: ['assigneeId'],
            },
        ]);
    }
}

export class TicketInvalidStatusConflictError extends ValidationError {
    public readonly code = 'TICKET_INVALID_STATUS_CONFLICT';

    constructor() {
        super('Ticket invalid status conflict error', [
            {
                code: 'custom',
                message: 'Status transition is not allowed',
                path: ['status'],
            },
        ]);
    }
}

export class TicketAssigneeNotFoundConflictError extends ValidationError {
    public readonly code = 'TICKET_ASSIGNEE_NOT_FOUND_CONFLICT';

    constructor() {
        super('Ticket assignee not found conflict error', [
            {
                code: 'custom',
                message: 'Assigned user does not exist',
                path: ['assigneeId'],
            },
        ]);
    }
}

export class TicketOrganizationMismatchConflictError extends ValidationError {
    public readonly code = 'TICKET_ORGANIZATION_MISMATCH_CONFLICT';

    constructor() {
        super('Ticket organization mismatch conflict error', [
            {
                code: 'custom',
                message: 'Assignee does not belong to the ticket organization',
                path: ['assigneeId'],
            },
        ]);
    }
}

export class TicketTitleConflictError extends ValidationError {
    public readonly code = 'TICKET_TITLE_CONFLICT';

    constructor() {
        super('Ticket title conflict error', [
            {
                code: 'custom',
                message: 'Ticket title already exists for this organization',
                path: ['title'],
            },
        ]);
    }
}

export class TicketTagConflictError extends ValidationError {
    public readonly code = 'TICKET_TAG_CONFLICT';

    constructor() {
        super('Ticket tag conflict error', [
            {
                code: 'custom',
                message: 'One or more tags are not allowed for this organization',
                path: ['tags'],
            },
        ]);
    }
}

export class TicketAcceptanceCriteriaConflictError extends ValidationError {
    public readonly code = 'TICKET_ACCEPTANCE_CRITERIA_CONFLICT';

    constructor() {
        super('Ticket acceptance criteria conflict error', [
            {
                code: 'custom',
                message: 'Acceptance criteria must contain at least one item',
                path: ['acceptanceCriteria'],
            },
        ]);
    }
}

export class TicketCreatorPermissionConflictError extends ValidationError {
    public readonly code = 'TICKET_CREATOR_PERMISSION_CONFLICT';

    constructor() {
        super('Ticket creator permission conflict error', [
            {
                code: 'custom',
                message: 'Creator does not have permission to create tickets in this organization',
                path: ['createdBy'],
            },
        ]);
    }
}

export class TicketModificationPermissionConflictError extends ValidationError {
    public readonly code = 'TICKET_MODIFICATION_PERMISSION_CONFLICT';

    constructor() {
        super('Ticket modification permission conflict error', [
            {
                code: 'custom',
                message: 'User is not allowed to modify this ticket',
                path: ['requesterId'],
            },
        ]);
    }
}

export class TicketConflictError extends ValidationError {
    public readonly code = 'TICKET_CONFLICT';

    constructor() {
        super('Ticket conflict error', []);
    }

    public addAssigneeConflictIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Ticket has already been assigned to a user',
            path: ['assigneeId'],
        });
    }

    public addInvalidStatusIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Status transition is not allowed',
            path: ['status'],
        });
    }

    public addAssigneeNotFoundIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Assigned user does not exist',
            path: ['assigneeId'],
        });
    }

    public addOrganizationMismatchIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Assignee does not belong to the ticket organization',
            path: ['assigneeId'],
        });
    }

    public addTitleConflictIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Ticket title already exists for this organization',
            path: ['title'],
        });
    }

    public addTagConflictIssue() {
        this.issues.push({
            code: 'custom',
            message: 'One or more tags are not allowed for this organization',
            path: ['tags'],
        });
    }

    public addAcceptanceCriteriaConflictIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Acceptance criteria must contain at least one item',
            path: ['acceptanceCriteria'],
        });
    }

    public addCreatorPermissionConflictIssue() {
        this.issues.push({
            code: 'custom',
            message: 'Creator does not have permission to create tickets in this organization',
            path: ['createdBy'],
        });
    }

    public addModificationPermissionConflictIssue() {
        this.issues.push({
            code: 'custom',
            message: 'User is not allowed to modify this ticket',
            path: ['requesterId'],
        });
    }
}