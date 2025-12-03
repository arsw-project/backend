import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket, TicketStatus } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTicketStatusUseCase } from '../update-ticket-status.case';

describe('UpdateTicketStatusUseCase', () => {
	let updateTicketStatusUseCase: UpdateTicketStatusUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTicket: Ticket = {
		id: 'ticket-123',
		orgId: 'org-123',
		title: 'Test Ticket',
		description: 'Test Description',
		acceptanceCriteria: [],
		status: 'Open',
		assigneeId: null,
		difficulty: 'M',
		tags: [],
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

		updateTicketStatusUseCase = new UpdateTicketStatusUseCase(
			mockTicketRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should update status from Open to In Progress', async () => {
			const updatedTicket = {
				...mockTicket,
				status: 'In Progress' as TicketStatus,
			};
			vi.mocked(mockTicketRepository.updateStatus).mockResolvedValue(
				updatedTicket,
			);

			const result = await updateTicketStatusUseCase.execute(
				'ticket-123',
				'In Progress',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.status).toBe('In Progress');
			}
			expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
				'ticket-123',
				'In Progress',
			);
		});

		it('should update status from In Progress to Done', async () => {
			const inProgressTicket = {
				...mockTicket,
				status: 'In Progress' as TicketStatus,
			};
			const doneTicket = {
				...inProgressTicket,
				status: 'Done' as TicketStatus,
			};
			vi.mocked(mockTicketRepository.updateStatus).mockResolvedValue(
				doneTicket,
			);

			const result = await updateTicketStatusUseCase.execute(
				'ticket-123',
				'Done',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.status).toBe('Done');
			}
		});

		it('should update status from Done back to Open', async () => {
			const doneTicket = { ...mockTicket, status: 'Done' as TicketStatus };
			const reopenedTicket = { ...doneTicket, status: 'Open' as TicketStatus };
			vi.mocked(mockTicketRepository.updateStatus).mockResolvedValue(
				reopenedTicket,
			);

			const result = await updateTicketStatusUseCase.execute(
				'ticket-123',
				'Open',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.status).toBe('Open');
			}
		});
	});

	describe('execute - failure cases', () => {
		it('should return TicketNotFoundError when ticket does not exist', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(null);

			const result = await updateTicketStatusUseCase.execute(
				'non-existent',
				'In Progress',
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
				expect(result.error.message).toContain('non-existent');
			}
		});
		it('should call repository with correct parameters', async () => {
			vi.mocked(mockTicketRepository.updateStatus).mockResolvedValue(
				mockTicket,
			);

			await updateTicketStatusUseCase.execute('specific-id', 'Done');

			expect(mockTicketRepository.updateStatus).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.updateStatus).toHaveBeenCalledWith(
				'specific-id',
				'Done',
			);
		});
	});
});
