import { AuthModule } from '@auth/module/auth.module';
import { GetChatHistoryUseCase } from '@chat/application/use-cases/get-chat-history.case';
import { SaveChatMessageUseCase } from '@chat/application/use-cases/save-chat-message.case';
import { ChatModule } from '@chat/module/chat.module';
import { Module } from '@nestjs/common';
import { AddChatMessageUseCase } from '@rooms/application/use-cases/add-chat-message.case';
import { GetRoomUseCase } from '@rooms/application/use-cases/get-room.case';
import { GetRoomStatsUseCase } from '@rooms/application/use-cases/get-room-stats.case';
import { JoinRoomUseCase } from '@rooms/application/use-cases/join-room.case';
import { LeaveRoomUseCase } from '@rooms/application/use-cases/leave-room.case';
import { TouchRoomUseCase } from '@rooms/application/use-cases/touch-room.case';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { InMemoryRoomRepository } from '@rooms/infrastructure/adapters/in-memory-room.repository';
import { SignalingGateway } from '@rooms/infrastructure/gateway/signaling.gateway';
import { RoomInactivityChecker } from '@rooms/infrastructure/services/room-inactivity-checker.service';

// Shared map for socket to room mapping
const SOCKET_TO_ROOM_MAP = Symbol('SOCKET_TO_ROOM_MAP');

const RoomRepositoryProvider = {
	provide: RoomRepository,
	useClass: InMemoryRoomRepository,
};

@Module({
	imports: [AuthModule, ChatModule],
	providers: [
		// Shared state
		{
			provide: SOCKET_TO_ROOM_MAP,
			useValue: new Map<string, string>(),
		},
		// Repository
		RoomRepositoryProvider,
		// Use Cases
		{
			provide: JoinRoomUseCase,
			useFactory: (
				roomRepository: RoomRepository,
				getChatHistoryUseCase: GetChatHistoryUseCase,
				socketToRoomMap: Map<string, string>,
			) => {
				return new JoinRoomUseCase(
					roomRepository,
					getChatHistoryUseCase,
					socketToRoomMap,
				);
			},
			inject: [RoomRepository, GetChatHistoryUseCase, SOCKET_TO_ROOM_MAP],
		},
		{
			provide: LeaveRoomUseCase,
			useFactory: (
				roomRepository: RoomRepository,
				socketToRoomMap: Map<string, string>,
			) => {
				return new LeaveRoomUseCase(roomRepository, socketToRoomMap);
			},
			inject: [RoomRepository, SOCKET_TO_ROOM_MAP],
		},
		{
			provide: GetRoomUseCase,
			useFactory: (
				roomRepository: RoomRepository,
				socketToRoomMap: Map<string, string>,
			) => {
				return new GetRoomUseCase(roomRepository, socketToRoomMap);
			},
			inject: [RoomRepository, SOCKET_TO_ROOM_MAP],
		},
		{
			provide: AddChatMessageUseCase,
			useFactory: (
				roomRepository: RoomRepository,
				saveChatMessageUseCase: SaveChatMessageUseCase,
			) => {
				return new AddChatMessageUseCase(
					roomRepository,
					saveChatMessageUseCase,
				);
			},
			inject: [RoomRepository, SaveChatMessageUseCase],
		},
		{
			provide: TouchRoomUseCase,
			useFactory: (roomRepository: RoomRepository) => {
				return new TouchRoomUseCase(roomRepository);
			},
			inject: [RoomRepository],
		},
		{
			provide: GetRoomStatsUseCase,
			useFactory: (roomRepository: RoomRepository) => {
				return new GetRoomStatsUseCase(roomRepository);
			},
			inject: [RoomRepository],
		},
		// Infrastructure services
		{
			provide: RoomInactivityChecker,
			useFactory: (
				roomRepository: RoomRepository,
				socketToRoomMap: Map<string, string>,
			) => {
				return new RoomInactivityChecker(roomRepository, socketToRoomMap);
			},
			inject: [RoomRepository, SOCKET_TO_ROOM_MAP],
		},
		// Gateway
		SignalingGateway,
	],
	exports: [
		JoinRoomUseCase,
		LeaveRoomUseCase,
		GetRoomUseCase,
		AddChatMessageUseCase,
		TouchRoomUseCase,
		GetRoomStatsUseCase,
	],
})
export class RoomsModule {}
