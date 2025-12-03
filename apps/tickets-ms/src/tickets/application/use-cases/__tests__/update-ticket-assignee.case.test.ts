import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTicketAssigneeUseCase } from '../update-ticket-assignee.case';

describe('UpdateTicketAssigneeUseCase', () => {
	let updateTicketAssigneeUseCase: UpdateTicketAssigneeUseCase;
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

		updateTicketAssigneeUseCase = new UpdateTicketAssigneeUseCase(
			mockTicketRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should assign ticket to a user', async () => {
			const assignedTicket = { ...mockTicket, assigneeId: 'new-assignee' };
			vi.mocked(mockTicketRepository.updateAssignee).mockResolvedValue(
				assignedTicket,
			);

			const result = await updateTicketAssigneeUseCase.execute(
				'ticket-123',
				'new-assignee',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.assigneeId).toBe('new-assignee');
			}
			expect(mockTicketRepository.updateAssignee).toHaveBeenCalledWith(
				'ticket-123',
				'new-assignee',
			);
		});

		it('should unassign ticket (set assignee to null)', async () => {
			const assignedTicket = { ...mockTicket, assigneeId: 'current-assignee' };
			const unassignedTicket = { ...assignedTicket, assigneeId: null };
			vi.mocked(mockTicketRepository.updateAssignee).mockResolvedValue(
				unassignedTicket,
			);

			const result = await updateTicketAssigneeUseCase.execute(
				'ticket-123',
				null,
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.assigneeId).toBeNull();
			}
			expect(mockTicketRepository.updateAssignee).toHaveBeenCalledWith(
				'ticket-123',
				null,
			);
		});

		it('should reassign ticket from one user to another', async () => {
			const reassignedTicket = { ...mockTicket, assigneeId: 'another-user' };
			vi.mocked(mockTicketRepository.updateAssignee).mockResolvedValue(
				reassignedTicket,
			);

			const result = await updateTicketAssigneeUseCase.execute(
				'ticket-123',
				'another-user',
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.assigneeId).toBe('another-user');
			}
		});
	});

	describe('execute - failure cases', () => {
		it('should return TicketNotFoundError when ticket does not exist', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(null);

			const result = await updateTicketAssigneeUseCase.execute(
				'non-existent',
				'some-user',
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
				expect(result.error.message).toContain('non-existent');
			}
		});

		it('should return TicketNotFoundError when trying to unassign non-existent ticket', async () => {
			vi.mocked(mockTicketRepository.updateAssignee).mockResolvedValue(null);

			const result = await updateTicketAssigneeUseCase.execute(
				'non-existent',
				null,
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
			}
		});

		it('should call repository with correct parameters', async () => {
			vi.mocked(mockTicketRepository.updateAssignee).mockResolvedValue(
				mockTicket,
			);

			await updateTicketAssigneeUseCase.execute(
				'specific-ticket',
				'specific-user',
			);

			expect(mockTicketRepository.updateAssignee).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.updateAssignee).toHaveBeenCalledWith(
				'specific-ticket',
				'specific-user',
			);
		});
	});
});
