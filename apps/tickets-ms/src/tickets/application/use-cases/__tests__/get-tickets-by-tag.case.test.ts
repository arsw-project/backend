import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetTicketsByTagUseCase } from '../get-tickets-by-tag.case';

describe('GetTicketsByTagUseCase', () => {
	let getTicketsByTagUseCase: GetTicketsByTagUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTickets: Ticket[] = [
		{
			id: 'ticket-1',
			orgId: 'org-123',
			title: 'Backend Ticket',
			description: 'Description 1',
			acceptanceCriteria: [],
			status: 'Open',
			assigneeId: 'user-1',
			difficulty: 'M',
			tags: ['backend', 'api'],
			createdBy: 'creator-1',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'ticket-2',
			orgId: 'org-456',
			title: 'Another Backend Ticket',
			description: 'Description 2',
			acceptanceCriteria: [],
			status: 'In Progress',
			assigneeId: null,
			difficulty: 'L',
			tags: ['backend', 'database'],
			createdBy: 'creator-2',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	beforeEach(() => {
		mockTicketRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			findAllByOrgId: vi.fn(),
			findByAssigneeId: vi.fn(),
			findByTag: vi.fn(),
			findByCreatorId: vi.fn(),
			findByStatus: vi.fn(),
			findByDifficulty: vi.fn(),
			update: vi.fn(),
			updateStatus: vi.fn(),
			updateAssignee: vi.fn(),
			updateDifficulty: vi.fn(),
			delete: vi.fn(),
			deleteByOrganizationId: vi.fn(),
			deleteByCreatorId: vi.fn(),
		} as unknown as TicketRepository;

		getTicketsByTagUseCase = new GetTicketsByTagUseCase(mockTicketRepository);
	});

	describe('execute', () => {
		it('should return all tickets with the specified tag', async () => {
			vi.mocked(mockTicketRepository.findByTag).mockResolvedValue(mockTickets);

			const result = await getTicketsByTagUseCase.execute('backend');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockTickets);
				expect(result.value).toHaveLength(2);
				expect(result.value.every((t) => t.tags.includes('backend'))).toBe(
					true,
				);
			}
			expect(mockTicketRepository.findByTag).toHaveBeenCalledWith('backend');
		});

		it('should return empty array when no tickets have the tag', async () => {
			vi.mocked(mockTicketRepository.findByTag).mockResolvedValue([]);

			const result = await getTicketsByTagUseCase.execute('nonexistent-tag');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
				expect(result.value).toHaveLength(0);
			}
		});

		it('should call repository with correct tag', async () => {
			vi.mocked(mockTicketRepository.findByTag).mockResolvedValue([]);

			await getTicketsByTagUseCase.execute('urgent');

			expect(mockTicketRepository.findByTag).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.findByTag).toHaveBeenCalledWith('urgent');
		});

		it('should handle tags with special characters', async () => {
			vi.mocked(mockTicketRepository.findByTag).mockResolvedValue([]);

			await getTicketsByTagUseCase.execute('priority-high');

			expect(mockTicketRepository.findByTag).toHaveBeenCalledWith(
				'priority-high',
			);
		});
	});
});
