import { ApplicationError } from '@common/errors/application.error';

export class ChatMessageSaveError extends ApplicationError {
	public readonly code = 'CHAT_MESSAGE_SAVE_ERROR';

	constructor(ticketId: string) {
		super(`Failed to save chat message for ticket ${ticketId}`);
	}
}
