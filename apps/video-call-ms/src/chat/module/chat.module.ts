import { GetChatHistoryUseCase } from '@chat/application/use-cases/get-chat-history.case';
import { GetChatHistoryPaginatedUseCase } from '@chat/application/use-cases/get-chat-history-paginated.case';
import { SaveChatMessageUseCase } from '@chat/application/use-cases/save-chat-message.case';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { DrizzleChatRepository } from '@chat/infrastructure/adapters/drizzle-chat.repository';
import { ChatController } from '@chat/infrastructure/http/chat-rest.controller';
import { Module } from '@nestjs/common';

const ChatRepositoryProvider = {
	provide: ChatRepository,
	useClass: DrizzleChatRepository,
};

@Module({
	controllers: [ChatController],
	providers: [
		ChatRepositoryProvider,
		{
			provide: SaveChatMessageUseCase,
			useFactory: (chatRepository: ChatRepository) => {
				return new SaveChatMessageUseCase(chatRepository);
			},
			inject: [ChatRepository],
		},
		{
			provide: GetChatHistoryUseCase,
			useFactory: (chatRepository: ChatRepository) => {
				return new GetChatHistoryUseCase(chatRepository);
			},
			inject: [ChatRepository],
		},
		{
			provide: GetChatHistoryPaginatedUseCase,
			useFactory: (chatRepository: ChatRepository) => {
				return new GetChatHistoryPaginatedUseCase(chatRepository);
			},
			inject: [ChatRepository],
		},
	],
	exports: [
		SaveChatMessageUseCase,
		GetChatHistoryUseCase,
		GetChatHistoryPaginatedUseCase,
	],
})
export class ChatModule {}
