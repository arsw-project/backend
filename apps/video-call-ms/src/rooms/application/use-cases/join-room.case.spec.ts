import type { SessionUser } from '@auth/domain/entities/session-user.entity';
import { GetChatHistoryUseCase } from '@chat/application/use-cases/get-chat-history.case';
import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import type { Participant, Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JoinRoomUseCase } from './join-room.case';

describe('JoinRoomUseCase', () => {
	let useCase: JoinRoomUseCase;
	let roomRepository: RoomRepository;
	let getChatHistoryUseCase: GetChatHistoryUseCase;
	let socketToRoomMap: Map<string, string>;

	const mockUser: SessionUser = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
		role: 'user',
	};

	const mockRoom: Room = {
		ticketId: 'ticket-123',
		orgId: 'org-123',
		createdAt: new Date('2024-01-01'),
		lastActivityAt: new Date('2024-01-01'),
		inactivityTimeoutMs: 30 * 60 * 1000,
		participants: new Map(),
	};

	const mockParticipant: Participant = {
		socketId: 'socket-123',
		user: mockUser,
		joinedAt: new Date('2024-01-01'),
	};

	const mockChatHistory: ChatMessage[] = [
		{
			id: 'msg-1',
			ticketId: 'ticket-123',
			orgId: 'org-123',
			userId: 'user-456',
			userName: 'Other User',
			content: 'Hello',
			createdAt: new Date('2024-01-01'),
		},
	];

	beforeEach(() => {
		roomRepository = {
			create: vi.fn(),
			findByTicketId: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			addParticipant: vi.fn(),
			removeParticipant: vi.fn(),
			getParticipant: vi.fn(),
			getAllParticipants: vi.fn(),
			getOtherParticipants: vi.fn(),
			getParticipantCount: vi.fn(),
			isRoomEmpty: vi.fn(),
			touch: vi.fn(),
			isInactive: vi.fn(),
			getTimeUntilInactive: vi.fn(),
		} as unknown as RoomRepository;

		getChatHistoryUseCase = {
			execute: vi.fn(),
		} as unknown as GetChatHistoryUseCase;

		socketToRoomMap = new Map();

		useCase = new JoinRoomUseCase(
			roomRepository,
			getChatHistoryUseCase,
			socketToRoomMap,
		);
	});

	describe('execute', () => {
		it('should join existing room successfully', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.addParticipant).mockReturnValue(mockParticipant);
			vi.mocked(getChatHistoryUseCase.execute).mockResolvedValue({
				ok: true,
				value: mockChatHistory,
				error: undefined as never,
			});

			// Act
			const result = await useCase.execute(
				'ticket-123',
				'org-123',
				'socket-123',
				mockUser,
			);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.room).toEqual(mockRoom);
			expect(result.value.participant).toEqual(mockParticipant);
			expect(result.value.chatHistory).toEqual(mockChatHistory);
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
			expect(roomRepository.create).not.toHaveBeenCalled();
			expect(roomRepository.addParticipant).toHaveBeenCalledWith(
				'ticket-123',
				'socket-123',
				mockUser,
			);
			expect(socketToRoomMap.get('socket-123')).toBe('ticket-123');
		});

		it('should create new room when it does not exist', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(undefined);
			vi.mocked(roomRepository.create).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.addParticipant).mockReturnValue(mockParticipant);
			vi.mocked(getChatHistoryUseCase.execute).mockResolvedValue({
				ok: true,
				value: [],
				error: undefined as never,
			});

			// Act
			const result = await useCase.execute(
				'ticket-123',
				'org-123',
				'socket-123',
				mockUser,
			);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.room).toEqual(mockRoom);
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
			expect(roomRepository.create).toHaveBeenCalledWith(
				'ticket-123',
				'org-123',
			);
			expect(roomRepository.addParticipant).toHaveBeenCalledWith(
				'ticket-123',
				'socket-123',
				mockUser,
			);
		});

		it('should return empty chat history for new room', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(undefined);
			vi.mocked(roomRepository.create).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.addParticipant).mockReturnValue(mockParticipant);
			vi.mocked(getChatHistoryUseCase.execute).mockResolvedValue({
				ok: true,
				value: [],
				error: undefined as never,
			});

			// Act
			const result = await useCase.execute(
				'ticket-123',
				'org-123',
				'socket-123',
				mockUser,
			);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.chatHistory).toEqual([]);
			expect(getChatHistoryUseCase.execute).toHaveBeenCalledWith('ticket-123');
		});

		it('should store socket to room mapping', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.addParticipant).mockReturnValue(mockParticipant);
			vi.mocked(getChatHistoryUseCase.execute).mockResolvedValue({
				ok: true,
				value: [],
				error: undefined as never,
			});

			// Act
			await useCase.execute('ticket-123', 'org-123', 'socket-123', mockUser);

			// Assert
			expect(socketToRoomMap.get('socket-123')).toBe('ticket-123');
		});

		it('should handle multiple participants joining same room', async () => {
			// Arrange
			const secondUser: SessionUser = {
				id: 'user-456',
				name: 'Second User',
				email: 'second@example.com',
				role: 'user',
			};
			const secondParticipant: Participant = {
				socketId: 'socket-456',
				user: secondUser,
				joinedAt: new Date(),
			};

			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.addParticipant)
				.mockReturnValueOnce(mockParticipant)
				.mockReturnValueOnce(secondParticipant);
			vi.mocked(getChatHistoryUseCase.execute).mockResolvedValue({
				ok: true,
				value: [],
				error: undefined as never,
			});

			// Act
			await useCase.execute('ticket-123', 'org-123', 'socket-123', mockUser);
			await useCase.execute('ticket-123', 'org-123', 'socket-456', secondUser);

			// Assert
			expect(socketToRoomMap.get('socket-123')).toBe('ticket-123');
			expect(socketToRoomMap.get('socket-456')).toBe('ticket-123');
			expect(roomRepository.addParticipant).toHaveBeenCalledTimes(2);
		});
	});
});
