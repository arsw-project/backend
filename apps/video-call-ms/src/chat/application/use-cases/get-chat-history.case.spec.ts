import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetChatHistoryUseCase } from './get-chat-history.case';

describe('GetChatHistoryUseCase', () => {
	let useCase: GetChatHistoryUseCase;
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
		{
			id: 'msg-3',
			ticketId: 'ticket-123',
			orgId: 'org-123',
			userId: 'user-1',
			userName: 'User One',
			content: 'How are you?',
			createdAt: new Date('2024-01-01T10:02:00'),
		},
	];

	beforeEach(() => {
		chatRepository = {
			save: vi.fn(),
			findByTicketId: vi.fn(),
			findByTicketIdPaginated: vi.fn(),
			countByTicketId: vi.fn(),
		} as unknown as ChatRepository;

		useCase = new GetChatHistoryUseCase(chatRepository);
	});

	describe('execute', () => {
		it('should return all messages for a ticket', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketId).mockResolvedValue(mockMessages);

			// Act
			const result = await useCase.execute('ticket-123');

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toEqual(mockMessages);
			expect(result.value).toHaveLength(3);
			expect(chatRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
			expect(chatRepository.findByTicketId).toHaveBeenCalledTimes(1);
		});

		it('should return empty array when no messages exist', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketId).mockResolvedValue([]);

			// Act
			const result = await useCase.execute('ticket-with-no-messages');

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toEqual([]);
			expect(result.value).toHaveLength(0);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(chatRepository.findByTicketId).mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute('ticket-123')).rejects.toThrow(
				'Database connection failed',
			);
		});

		it('should call repository with correct ticket ID', async () => {
			// Arrange
			vi.mocked(chatRepository.findByTicketId).mockResolvedValue([]);

			// Act
			await useCase.execute('specific-ticket-id');

			// Assert
			expect(chatRepository.findByTicketId).toHaveBeenCalledWith(
				'specific-ticket-id',
			);
		});
	});
});
