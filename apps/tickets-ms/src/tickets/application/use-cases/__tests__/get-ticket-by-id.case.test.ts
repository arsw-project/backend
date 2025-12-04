import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetTicketByIdUseCase } from '../get-ticket-by-id.case';

describe('GetTicketByIdUseCase', () => {
	let getTicketByIdUseCase: GetTicketByIdUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTicket: Ticket = {
		id: 'ticket-123',
		orgId: 'org-123',
		title: 'Test Ticket',
		description: 'Test Description',
		acceptanceCriteria: ['Criteria 1'],
		status: 'Open',
		assigneeId: null,
		difficulty: 'M',
		tags: ['test'],
		createdBy: 'user-123',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

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

		getTicketByIdUseCase = new GetTicketByIdUseCase(mockTicketRepository);
	});

	describe('execute', () => {
		it('should return ticket when found', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);

			const result = await getTicketByIdUseCase.execute('ticket-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockTicket);
			}
			expect(mockTicketRepository.findById).toHaveBeenCalledWith('ticket-123');
		});

		it('should return null when ticket not found', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(null);

			const result = await getTicketByIdUseCase.execute('non-existent-id');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBeNull();
			}
			expect(mockTicketRepository.findById).toHaveBeenCalledWith(
				'non-existent-id',
			);
		});

		it('should call repository with correct id', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);

			await getTicketByIdUseCase.execute('specific-ticket-id');

			expect(mockTicketRepository.findById).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.findById).toHaveBeenCalledWith(
				'specific-ticket-id',
			);
		});
	});
});
