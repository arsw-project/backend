export interface ChatMessage {
	id: string;
	ticketId: string;
	orgId: string;
	userId: string;
	userName: string;
	content: string;
	createdAt: Date;
}

export interface ChatMessageJson {
	id: string;
	ticketId: string;
	orgId: string;
	userId: string;
	userName: string;
	content: string;
	createdAt: string;
}

export function chatMessageToJson(message: ChatMessage): ChatMessageJson {
	return {
		id: message.id,
		ticketId: message.ticketId,
		orgId: message.orgId,
		userId: message.userId,
		userName: message.userName,
		content: message.content,
		createdAt: message.createdAt.toISOString(),
	};
}
