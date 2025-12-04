import { ApplicationError } from '@common/errors/application.error';

export class UserNotMemberError extends ApplicationError {
	public readonly code = 'USER_NOT_MEMBER';

	constructor(
		public readonly userId: string,
		public readonly organizationId: string,
		public readonly field: 'createdBy' | 'assigneeId',
	) {
		const fieldLabel = field === 'createdBy' ? 'Creator' : 'Assignee';
		super(
			`${fieldLabel} (${userId}) is not a member of organization (${organizationId})`,
		);
		this.name = 'UserNotMemberError';
	}
}
