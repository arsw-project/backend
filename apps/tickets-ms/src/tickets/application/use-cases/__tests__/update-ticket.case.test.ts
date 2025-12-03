import { UpdateTicketDto } from '@tickets/application/dto/update-ticket.dto';
import { TicketConflictError } from '@tickets/application/errors/ticket-conflict.error';
import { TicketNotFoundError } from '@tickets/application/errors/ticket-not-found.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTicketUseCase } from '../update-ticket.case';

describe('UpdateTicketUseCase', () => {
	let updateTicketUseCase: UpdateTicketUseCase;
	let mockTicketRepository: TicketRepository;

	const mockTicket: Ticket = {
		id: 'ticket-123',
		orgId: 'org-123',
		title: 'Original Title',
		description: 'Original Description',
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

		updateTicketUseCase = new UpdateTicketUseCase(mockTicketRepository);
	});

	describe('execute - success cases', () => {
		it('should successfully update ticket description', async () => {
			const updateDto: UpdateTicketDto = {
				description: 'Updated Description',
			};
			const updatedTicket = {
				...mockTicket,
				description: 'Updated Description',
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateTicketUseCase.execute('ticket-123', updateDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.description).toBe('Updated Description');
			}
			expect(mockTicketRepository.update).toHaveBeenCalledWith(
				'ticket-123',
				updateDto,
			);
		});

		it('should successfully update ticket title when no conflict', async () => {
			const updateDto: UpdateTicketDto = {
				title: 'New Unique Title',
			};
			const updatedTicket = { ...mockTicket, title: 'New Unique Title' };

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([
				mockTicket,
			]);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateTicketUseCase.execute('ticket-123', updateDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.title).toBe('New Unique Title');
			}
		});

		it('should allow updating ticket to its own title', async () => {
			const updateDto: UpdateTicketDto = {
				title: 'Original Title', // Same as current title
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([
				mockTicket,
			]);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(mockTicket);

			const result = await updateTicketUseCase.execute('ticket-123', updateDto);

			expect(result.ok).toBe(true);
		});

		it('should update multiple fields at once', async () => {
			const updateDto: UpdateTicketDto = {
				title: 'New Title',
				description: 'New Description',
				tags: ['new-tag'],
				difficulty: 'L',
			};
			const updatedTicket = {
				...mockTicket,
				...updateDto,
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([
				mockTicket,
			]);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(updatedTicket);

			const result = await updateTicketUseCase.execute('ticket-123', updateDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.title).toBe('New Title');
				expect(result.value.description).toBe('New Description');
				expect(result.value.tags).toEqual(['new-tag']);
				expect(result.value.difficulty).toBe('L');
			}
		});
	});

	describe('execute - failure cases', () => {
		it('should return TicketNotFoundError when ticket does not exist', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(null);

			const result = await updateTicketUseCase.execute('non-existent', {
				title: 'New Title',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
				expect(result.error.message).toContain('non-existent');
			}
		});

		it('should return TicketConflictError when title conflicts with another ticket', async () => {
			const anotherTicket: Ticket = {
				...mockTicket,
				id: 'ticket-456',
				title: 'Existing Title',
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([
				mockTicket,
				anotherTicket,
			]);

			const result = await updateTicketUseCase.execute('ticket-123', {
				title: 'Existing Title',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketConflictError);
			}
		});

		it('should return TicketConflictError for case-insensitive title match', async () => {
			const anotherTicket: Ticket = {
				...mockTicket,
				id: 'ticket-456',
				title: 'existing title',
			};

			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([
				mockTicket,
				anotherTicket,
			]);

			const result = await updateTicketUseCase.execute('ticket-123', {
				title: 'EXISTING TITLE',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketConflictError);
			}
		});

		it('should return TicketNotFoundError when update returns null', async () => {
			vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket);
			vi.mocked(mockTicketRepository.update).mockResolvedValue(null);

			const result = await updateTicketUseCase.execute('ticket-123', {
				description: 'New',
			});

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketNotFoundError);
			}
		});
	});
});
