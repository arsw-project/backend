import { Ticket, TicketStatus } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetTicketsByStatusUseCase } from '../get-tickets-by-status.case';

describe('GetTicketsByStatusUseCase', () => {
	let getTicketsByStatusUseCase: GetTicketsByStatusUseCase;
	let mockTicketRepository: TicketRepository;

	const createMockTickets = (status: TicketStatus): Ticket[] => [
		{
			id: 'ticket-1',
			orgId: 'org-123',
			title: 'Ticket 1',
			description: 'Description 1',
			acceptanceCriteria: [],
			status,
			assigneeId: 'user-1',
			difficulty: 'S',
			tags: [],
			createdBy: 'creator-1',
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 'ticket-2',
			orgId: 'org-456',
			title: 'Ticket 2',
			description: 'Description 2',
			acceptanceCriteria: [],
			status,
			assigneeId: null,
			difficulty: 'M',
			tags: [],
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

		getTicketsByStatusUseCase = new GetTicketsByStatusUseCase(
			mockTicketRepository,
		);
	});

	describe('execute', () => {
		it('should return all Open tickets', async () => {
			const openTickets = createMockTickets('Open');
			vi.mocked(mockTicketRepository.findByStatus).mockResolvedValue(
				openTickets,
			);

			const result = await getTicketsByStatusUseCase.execute('Open');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(openTickets);
				expect(result.value.every((t) => t.status === 'Open')).toBe(true);
			}
			expect(mockTicketRepository.findByStatus).toHaveBeenCalledWith('Open');
		});

		it('should return all In Progress tickets', async () => {
			const inProgressTickets = createMockTickets('In Progress');
			vi.mocked(mockTicketRepository.findByStatus).mockResolvedValue(
				inProgressTickets,
			);

			const result = await getTicketsByStatusUseCase.execute('In Progress');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.every((t) => t.status === 'In Progress')).toBe(
					true,
				);
			}
			expect(mockTicketRepository.findByStatus).toHaveBeenCalledWith(
				'In Progress',
			);
		});

		it('should return all Done tickets', async () => {
			const doneTickets = createMockTickets('Done');
			vi.mocked(mockTicketRepository.findByStatus).mockResolvedValue(
				doneTickets,
			);

			const result = await getTicketsByStatusUseCase.execute('Done');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.every((t) => t.status === 'Done')).toBe(true);
			}
			expect(mockTicketRepository.findByStatus).toHaveBeenCalledWith('Done');
		});

		it('should return empty array when no tickets with specified status', async () => {
			vi.mocked(mockTicketRepository.findByStatus).mockResolvedValue([]);

			const result = await getTicketsByStatusUseCase.execute('Done');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual([]);
			}
		});

		it('should call repository with correct status', async () => {
			vi.mocked(mockTicketRepository.findByStatus).mockResolvedValue([]);

			await getTicketsByStatusUseCase.execute('In Progress');

			expect(mockTicketRepository.findByStatus).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.findByStatus).toHaveBeenCalledWith(
				'In Progress',
			);
		});
	});
});
