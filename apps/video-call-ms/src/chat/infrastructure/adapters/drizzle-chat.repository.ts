import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import type { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import {
	ChatMessageRecord,
	chatMessagesTable,
} from '@chat/infrastructure/entities/chat-message.drizzle-schema';
import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';

@Injectable()
export class DrizzleChatRepository implements ChatRepository {
	constructor(private readonly drizzle: DrizzleConnection) {}

	async save(message: ChatMessage): Promise<ChatMessage> {
		const [record] = await this.drizzle.database
			.insert(chatMessagesTable)
			.values({
				id: message.id,
				ticketId: message.ticketId,
				orgId: message.orgId,
				userId: message.userId,
				userName: message.userName,
				content: message.content,
				createdAt: message.createdAt,
			})
			.returning();

		return this.toDomain(record);
	}

	async findByTicketId(ticketId: string): Promise<ChatMessage[]> {
		const records = await this.drizzle.database
			.select()
			.from(chatMessagesTable)
			.where(eq(chatMessagesTable.ticketId, ticketId))
			.orderBy(chatMessagesTable.createdAt);

		return records.map((r) => this.toDomain(r));
	}

	async findByTicketIdPaginated(
		ticketId: string,
		limit: number,
		offset: number,
	): Promise<ChatMessage[]> {
		const records = await this.drizzle.database
			.select()
			.from(chatMessagesTable)
			.where(eq(chatMessagesTable.ticketId, ticketId))
			.orderBy(desc(chatMessagesTable.createdAt))
			.limit(limit)
			.offset(offset);

		// Reverse to get chronological order
		return records.reverse().map((r) => this.toDomain(r));
	}

	async countByTicketId(ticketId: string): Promise<number> {
		const [result] = await this.drizzle.database
			.select({ count: count() })
			.from(chatMessagesTable)
			.where(eq(chatMessagesTable.ticketId, ticketId));

		return result?.count ?? 0;
	}

	private toDomain(record: ChatMessageRecord): ChatMessage {
		return {
			id: record.id,
			ticketId: record.ticketId,
			orgId: record.orgId,
			userId: record.userId,
			userName: record.userName,
			content: record.content,
			createdAt: record.createdAt,
		};
	}
}
