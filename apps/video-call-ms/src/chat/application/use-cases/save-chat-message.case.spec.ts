import type { ChatMessage } from '@chat/domain/entities/chat-message.entity';
import { ChatRepository } from '@chat/domain/ports/chat.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveChatMessageUseCase } from './save-chat-message.case';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
	randomUUID: vi.fn(() => 'generated-uuid'),
});

describe('SaveChatMessageUseCase', () => {
	let useCase: SaveChatMessageUseCase;
	let chatRepository: ChatRepository;

	const messageParams = {
		ticketId: 'ticket-123',
		orgId: 'org-123',
		userId: 'user-123',
		userName: 'Test User',
		content: 'Hello, world!',
	};

	beforeEach(() => {
		vi.clearAllMocks();

		chatRepository = {
			save: vi.fn(),
			findByTicketId: vi.fn(),
			findByTicketIdPaginated: vi.fn(),
			countByTicketId: vi.fn(),
		} as unknown as ChatRepository;

		useCase = new SaveChatMessageUseCase(chatRepository);
	});

	describe('execute', () => {
		it('should save chat message successfully', async () => {
			// Arrange
			const savedMessage: ChatMessage = {
				id: 'generated-uuid',
				...messageParams,
				createdAt: expect.any(Date),
			};
			vi.mocked(chatRepository.save).mockResolvedValue(savedMessage);

			// Act
			const result = await useCase.execute(messageParams);

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.id).toBe('generated-uuid');
			expect(result.value.ticketId).toBe(messageParams.ticketId);
			expect(result.value.orgId).toBe(messageParams.orgId);
			expect(result.value.userId).toBe(messageParams.userId);
			expect(result.value.userName).toBe(messageParams.userName);
			expect(result.value.content).toBe(messageParams.content);
		});

		it('should generate UUID for message ID', async () => {
			// Arrange
			vi.mocked(chatRepository.save).mockImplementation(async (msg) => msg);

			// Act
			await useCase.execute(messageParams);

			// Assert
			expect(chatRepository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'generated-uuid',
				}),
			);
		});

		it('should set createdAt to current date', async () => {
			// Arrange
			const beforeExecution = new Date();
			vi.mocked(chatRepository.save).mockImplementation(async (msg) => msg);

			// Act
			const result = await useCase.execute(messageParams);
			const afterExecution = new Date();

			// Assert
			expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(
				beforeExecution.getTime(),
			);
			expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(
				afterExecution.getTime(),
			);
		});

		it('should call repository save with complete message', async () => {
			// Arrange
			vi.mocked(chatRepository.save).mockImplementation(async (msg) => msg);

			// Act
			await useCase.execute(messageParams);

			// Assert
			expect(chatRepository.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'generated-uuid',
					ticketId: 'ticket-123',
					orgId: 'org-123',
					userId: 'user-123',
					userName: 'Test User',
					content: 'Hello, world!',
					createdAt: expect.any(Date),
				}),
			);
			expect(chatRepository.save).toHaveBeenCalledTimes(1);
		});

		it('should handle repository errors', async () => {
			// Arrange
			const dbError = new Error('Database connection failed');
			vi.mocked(chatRepository.save).mockRejectedValue(dbError);

			// Act & Assert
			await expect(useCase.execute(messageParams)).rejects.toThrow(
				'Database connection failed',
			);
		});

		it('should preserve all message parameters', async () => {
			// Arrange
			const specificParams = {
				ticketId: 'specific-ticket',
				orgId: 'specific-org',
				userId: 'specific-user',
				userName: 'Specific Name',
				content: 'Specific content message',
			};
			vi.mocked(chatRepository.save).mockImplementation(async (msg) => msg);

			// Act
			const result = await useCase.execute(specificParams);

			// Assert
			expect(result.value.ticketId).toBe('specific-ticket');
			expect(result.value.orgId).toBe('specific-org');
			expect(result.value.userId).toBe('specific-user');
			expect(result.value.userName).toBe('Specific Name');
			expect(result.value.content).toBe('Specific content message');
		});
	});
});
