import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateAcceptanceCriteriaUseCase } from '../update-acceptance-criteria.case';

describe('UpdateAcceptanceCriteriaUseCase', () => {
	let updateAcceptanceCriteriaUseCase: UpdateAcceptanceCriteriaUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTicket: Ticket = {
		id: 'ticket-123',
		orgId: 'org-123',
		title: 'Test Ticket',
		description: 'Test Description',
		acceptanceCriteria: ['Original Criteria 1', 'Original Criteria 2'],
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

		updateAcceptanceCriteriaUseCase = new UpdateAcceptanceCriteriaUseCase(
			mockTicketRepository,
		);
	});

	describe('execute - success cases', () => {
		it('should update acceptance criteria', async () => {
			const newCriteria = [
				'New Criteria 1',
				'New Criteria 2',
				'New Criteria 3',
			];
			const updatedTicket = { ...mockTicket, acceptanceCriteria: newCriteria };

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateAcceptanceCriteriaUseCase.execute(
				'ticket-123',
				newCriteria,
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.acceptanceCriteria).toEqual(newCriteria);
				expect(result.value.acceptanceCriteria).toHaveLength(3);
			}
			expect(mockTicketRepository.update).toHaveBeenCalledWith('ticket-123', {
				acceptanceCriteria: newCriteria,
			});
		});

		it('should clear acceptance criteria with empty array', async () => {
			const updatedTicket = { ...mockTicket, acceptanceCriteria: [] };

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateAcceptanceCriteriaUseCase.execute(
				'ticket-123',
				[],
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.acceptanceCriteria).toEqual([]);
				expect(result.value.acceptanceCriteria).toHaveLength(0);
			}
		});

		it('should replace all existing criteria', async () => {
			const singleCriteria = ['Only One Criteria'];
			const updatedTicket = {
				...mockTicket,
				acceptanceCriteria: singleCriteria,
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateAcceptanceCriteriaUseCase.execute(
				'ticket-123',
				singleCriteria,
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.acceptanceCriteria).toEqual(singleCriteria);
			}
		});

		it('should handle criteria with special characters', async () => {
			const specialCriteria = [
				'User can use special chars: @#$%',
				'API returns JSON { "key": "value" }',
				'Supports UTF-8: ñ, ü, 日本語',
			];
			const updatedTicket = {
				...mockTicket,
				acceptanceCriteria: specialCriteria,
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateAcceptanceCriteriaUseCase.execute(
				'ticket-123',
				specialCriteria,
			);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.acceptanceCriteria).toEqual(specialCriteria);
			}
		});
	});

	describe('execute - failure cases', () => {
		it('should return TicketNotFoundError when ticket does not exist', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(null);

			const result = await updateAcceptanceCriteriaUseCase.execute(
				'non-existent',
				['Criteria'],
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
				expect(result.error.message).toContain('non-existent');
			}
			expect(mockTicketRepository.update).not.toHaveBeenCalled();
		});

		it('should return TicketNotFoundError when update returns null', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(null);

			const result = await updateAcceptanceCriteriaUseCase.execute(
				'ticket-123',
				['New Criteria'],
			);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
			}
		});

		it('should first check if ticket exists before updating', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(mockTicket);

			await updateAcceptanceCriteriaUseCase.execute('ticket-123', ['Criteria']);

			expect(mockTicketRepository.findById).toHaveBeenCalledWith('ticket-123');
			expect(mockTicketRepository.findById).toHaveBeenCalledBefore(
				vi.mocked(mockTicketRepository.update),
			);
		});
	});
});
