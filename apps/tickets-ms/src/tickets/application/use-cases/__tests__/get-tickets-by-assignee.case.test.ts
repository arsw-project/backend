import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetTicketsByAssigneeUseCase } from '../get-tickets-by-assignee.case';

describe('GetTicketsByAssigneeUseCase', () => {
	let getTicketsByAssigneeUseCase: GetTicketsByAssigneeUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTickets: Ticket[] = [
		{
			id: 'ticket-1',
			orgId: 'org-123',
			title: 'Ticket 1',
			description: 'Description 1',
			acceptanceCriteria: [],
			status: 'Open',
			assigneeId: 'assignee-123',
			difficulty: 'S',
			tags: [],
			createdBy: 'user-1',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'ticket-2',
			orgId: 'org-456',
			title: 'Ticket 2',
			description: 'Description 2',
			acceptanceCriteria: [],
			status: 'In Progress',
			assigneeId: 'assignee-123',
			difficulty: 'M',
			tags: ['urgent'],
			createdBy: 'user-2',
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

		getTicketsByAssigneeUseCase = new GetTicketsByAssigneeUseCase(
			mockTicketRepository,
		);
	});

	describe('execute', () => {
		it('should return all tickets assigned to a user', async () => {
			vi.mocked(mockTicketRepository.findByAssigneeId).mockResolvedValue(
				mockTickets,
			);

			const result = await getTicketsByAssigneeUseCase.execute('assignee-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockTickets);
				expect(result.value).toHaveLength(2);
				expect(result.value.every((t) => t.assigneeId === 'assignee-123')).toBe(
					true,
				);
			}
			expect(mockTicketRepository.findByAssigneeId).toHaveBeenCalledWith(
				'assignee-123',
			);
		});

		it('should return empty array when user has no assigned tickets', async () => {
			vi.mocked(mockTicketRepository.findByAssigneeId).mockResolvedValue([]);

			const result =
				await getTicketsByAssigneeUseCase.execute('no-tickets-user');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
				expect(result.value).toHaveLength(0);
			}
		});

		it('should call repository with correct assignee id', async () => {
			vi.mocked(mockTicketRepository.findByAssigneeId).mockResolvedValue([]);

			await getTicketsByAssigneeUseCase.execute('specific-assignee-id');

			expect(mockTicketRepository.findByAssigneeId).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.findByAssigneeId).toHaveBeenCalledWith(
				'specific-assignee-id',
			);
		});
	});
});
