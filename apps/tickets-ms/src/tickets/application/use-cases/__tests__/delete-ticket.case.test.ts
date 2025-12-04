import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteTicketUseCase } from '../delete-ticket.case';

describe('DeleteTicketUseCase', () => {
	let deleteTicketUseCase: DeleteTicketUseCase;
	let mockTicketRepository: TicketRepository;

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

		deleteTicketUseCase = new DeleteTicketUseCase(mockTicketRepository);
	});

	describe('execute - success cases', () => {
		it('should successfully delete a ticket', async () => {
			vi.mocked(mockTicketRepository.delete).mockResolvedValue(true);

			const result = await deleteTicketUseCase.execute('ticket-123');

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toBe(true);
			}
			expect(mockTicketRepository.delete).toHaveBeenCalledWith('ticket-123');
		});

		it('should call repository delete with correct id', async () => {
			vi.mocked(mockTicketRepository.delete).mockResolvedValue(true);

			await deleteTicketUseCase.execute('specific-ticket-id');

			expect(mockTicketRepository.delete).toHaveBeenCalledTimes(1);
			expect(mockTicketRepository.delete).toHaveBeenCalledWith(
				'specific-ticket-id',
			);
		});
	});

	describe('execute - failure cases', () => {
		it('should return TicketNotFoundError when ticket does not exist', async () => {
			vi.mocked(mockTicketRepository.delete).mockResolvedValue(false);

			const result = await deleteTicketUseCase.execute('non-existent');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
				expect(result.error.message).toContain('non-existent');
			}
		});

		it('should return TicketNotFoundError when repository returns false', async () => {
			vi.mocked(mockTicketRepository.delete).mockResolvedValue(false);

			const result = await deleteTicketUseCase.execute('ticket-123');

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
			}
		});
	});
});
