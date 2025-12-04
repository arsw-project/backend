import { SaveChatMessageUseCase } from '@chat/application/use-cases/save-chat-message.case';
import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import type { Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomNotFoundError } from '../errors/room.errors';
import { AddChatMessageUseCase } from './add-chat-message.case';

describe('AddChatMessageUseCase', () => {
	let useCase: AddChatMessageUseCase;
	let roomRepository: RoomRepository;
	let saveChatMessageUseCase: SaveChatMessageUseCase;

	const mockRoom: Room = {
		ticketId: 'ticket-123',
		orgId: 'org-123',
		createdAt: new Date('2024-01-01'),
		lastActivityAt: new Date('2024-01-01'),
		inactivityTimeoutMs: 30 * 60 * 1000,
		participants: new Map(),
	};

	const mockChatMessage: ChatMessage = {
		id: 'msg-123',
		ticketId: 'ticket-123',
		orgId: 'org-123',
		userId: 'user-123',
		userName: 'Test User',
		content: 'Hello, world!',
		createdAt: new Date('2024-01-01'),
	};

	const messageParams = {
		ticketId: 'ticket-123',
		orgId: 'org-123',
		userId: 'user-123',
		userName: 'Test User',
		content: 'Hello, world!',
	};

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

		saveChatMessageUseCase = {
			execute: vi.fn(),
		} as unknown as SaveChatMessageUseCase;

		useCase = new AddChatMessageUseCase(roomRepository, saveChatMessageUseCase);
	});

	describe('execute', () => {
		it('should add chat message successfully when room exists', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(saveChatMessageUseCase.execute).mockResolvedValue({
				ok: true,
				value: mockChatMessage,
				error: undefined as never,
			});

			// Act
			const result = await useCase.execute(messageParams);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockChatMessage);
			}
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
			expect(roomRepository.touch).toHaveBeenCalledWith('ticket-123');
			expect(saveChatMessageUseCase.execute).toHaveBeenCalledWith(
				messageParams,
			);
		});

		it('should return error when room does not exist', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(undefined);

			// Act
			const result = await useCase.execute(messageParams);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(RoomNotFoundError);
				expect(result.error.code).toBe('ROOM_NOT_FOUND');
			}
			expect(roomRepository.touch).not.toHaveBeenCalled();
			expect(saveChatMessageUseCase.execute).not.toHaveBeenCalled();
		});

		it('should touch room to update activity timestamp', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(saveChatMessageUseCase.execute).mockResolvedValue({
				ok: true,
				value: mockChatMessage,
				error: undefined as never,
			});

			// Act
			await useCase.execute(messageParams);

			// Assert
			expect(roomRepository.touch).toHaveBeenCalledWith('ticket-123');
			expect(roomRepository.touch).toHaveBeenCalledTimes(1);
		});

		it('should persist message to database', async () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(saveChatMessageUseCase.execute).mockResolvedValue({
				ok: true,
				value: mockChatMessage,
				error: undefined as never,
			});

			// Act
			await useCase.execute(messageParams);

			// Assert
			expect(saveChatMessageUseCase.execute).toHaveBeenCalledWith(
				messageParams,
			);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(saveChatMessageUseCase.execute).mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute(messageParams)).rejects.toThrow(
				'Database connection failed',
			);
		});
	});
});
