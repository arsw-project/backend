import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';

export abstract class ChatRepository {
	/**
	 * Save a chat message to the database
	 */
	abstract save(message: ChatMessage): Promise<ChatMessage>;

	/**
	 * Get all messages for a ticket
	 */
	abstract findByTicketId(ticketId: string): Promise<ChatMessage[]>;

	/**
	 * Get messages for a ticket with pagination
	 */
	abstract findByTicketIdPaginated(
		ticketId: string,
		limit: number,
		offset: number,
	): Promise<ChatMessage[]>;

	/**
	 * Get message count for a ticket
	 */
	abstract countByTicketId(ticketId: string): Promise<number>;
}
