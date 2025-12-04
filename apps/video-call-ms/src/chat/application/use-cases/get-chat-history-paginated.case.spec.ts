import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetChatHistoryPaginatedUseCase } from './get-chat-history-paginated.case';

describe('GetChatHistoryPaginatedUseCase', () => {
	let useCase: GetChatHistoryPaginatedUseCase;
	let chatRepository: ChatRepository;

	const mockMessages: ChatMessage[] = [
		{
			id: 'msg-1',
			ticketId: 'ticket-123',
			orgId: 'org-123',
			userId: 'user-1',
			userName: 'User One',
			content: 'Hello',
			createdAt: new Date('2024-01-01T10:00:00'),
		},
		{
			id: 'msg-2',
			ticketId: 'ticket-123',
			orgId: 'org-123',
			userId: 'user-2',
			userName: 'User Two',
			content: 'Hi there!',
			createdAt: new Date('2024-01-01T10:01:00'),
		},
	];

	beforeEach(() => {
		chatRepository = {
			save: vi.fn(),
			findByTicketId: vi.fn(),
			findByTicketIdPaginated: vi.fn(),
			countByTicketId: vi.fn(),
		} as unknown as ChatRepository;

		useCase = new GetChatHistoryPaginatedUseCase(chatRepository);
	});

	describe('execute', () => {
		it('should return paginated messages with total count', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketIdPaginated).mockResolvedValue(
				mockMessages,
			);
			vi.mocked(chatRepository.countByTicketId).mockResolvedValue(100);

			// Act
			const result = await useCase.execute('ticket-123', 50, 0);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.messages).toEqual(mockMessages);
			expect(result.value.total).toBe(100);
			expect(chatRepository.findByTicketIdPaginated).toHaveBeenCalledWith(
				'ticket-123',
				50,
				0,
			);
			expect(chatRepository.countByTicketId).toHaveBeenCalledWith('ticket-123');
		});

		it('should use default limit and offset when not provided', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketIdPaginated).mockResolvedValue([]);
			vi.mocked(chatRepository.countByTicketId).mockResolvedValue(0);

			// Act
			await useCase.execute('ticket-123');

			// Assert
			expect(chatRepository.findByTicketIdPaginated).toHaveBeenCalledWith(
				'ticket-123',
				50,
				0,
			);
		});

		it('should handle custom pagination parameters', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketIdPaginated).mockResolvedValue(
				mockMessages,
			);
			vi.mocked(chatRepository.countByTicketId).mockResolvedValue(200);

			// Act
			const result = await useCase.execute('ticket-123', 20, 40);

			// Assert
			expect(result.ok).toBe(true);
			expect(chatRepository.findByTicketIdPaginated).toHaveBeenCalledWith(
				'ticket-123',
				20,
				40,
			);
		});

		it('should return empty array with zero total when no messages exist', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketIdPaginated).mockResolvedValue([]);
			vi.mocked(chatRepository.countByTicketId).mockResolvedValue(0);

			// Act
			const result = await useCase.execute('empty-ticket');

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.messages).toEqual([]);
			expect(result.value.total).toBe(0);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(chatRepository.findByTicketIdPaginated).mockRejectedValue(
				dbError,
			);

			// Act & Assert
			await expect(useCase.execute('ticket-123')).rejects.toThrow(
				'Database connection failed',
			);
		});

		it('should fetch messages and count in parallel', async () => {
			// Arrange
			let messagesResolved = false;
			let countResolved = false;

			vi.mocked(chatRepository.findByTicketIdPaginated).mockImplementation(
				async () => {
					messagesResolved = true;
					return mockMessages;
				},
			);
			vi.mocked(chatRepository.countByTicketId).mockImplementation(async () => {
				countResolved = true;
				return 100;
			});

			// Act
			await useCase.execute('ticket-123');

			// Assert
			expect(messagesResolved).toBe(true);
			expect(countResolved).toBe(true);
		});
	});
});
