import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetAllTicketsByOrgUseCase } from '../get-all-tickets-by-org.case';

describe('GetAllTicketsByOrgUseCase', () => {
	let getAllTicketsByOrgUseCase: GetAllTicketsByOrgUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTickets: Ticket[] = [
		{
			id: 'ticket-1',
			orgId: 'org-123',
			title: 'Ticket 1',
			description: 'Description 1',
			acceptanceCriteria: [],
			status: 'Open',
			assigneeId: null,
			difficulty: 'S',
			tags: [],
			createdBy: 'user-1',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'ticket-2',
			orgId: 'org-123',
			title: 'Ticket 2',
			description: 'Description 2',
			acceptanceCriteria: ['Criteria 1'],
			status: 'In Progress',
			assigneeId: 'user-2',
			difficulty: 'M',
			tags: ['backend'],
			createdBy: 'user-1',
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

		getAllTicketsByOrgUseCase = new GetAllTicketsByOrgUseCase(
			mockTicketRepository,
		);
	});

	describe('execute', () => {
		it('should return all tickets for an organization', async () => {
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue(
				mockTickets,
			);

			const result = await getAllTicketsByOrgUseCase.execute('org-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockTickets);
				expect(result.value).toHaveLength(2);
			}
			expect(mockTicketRepository.findAllByOrgId).toHaveBeenCalledWith(
				'org-123',
			);
		});

		it('should return empty array when organization has no tickets', async () => {
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([]);

			const result = await getAllTicketsByOrgUseCase.execute('org-empty');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
				expect(result.value).toHaveLength(0);
			}
			expect(mockTicketRepository.findAllByOrgId).toHaveBeenCalledWith(
				'org-empty',
			);
		});

		it('should call repository with correct organization id', async () => {
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([]);

			await getAllTicketsByOrgUseCase.execute('specific-org-id');

			expect(mockTicketRepository.findAllByOrgId).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.findAllByOrgId).toHaveBeenCalledWith(
				'specific-org-id',
			);
		});
	});
});
