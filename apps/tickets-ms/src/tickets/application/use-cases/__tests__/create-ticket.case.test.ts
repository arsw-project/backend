import { CreateTicketDto } from '@tickets/application/dto/create-ticket.dto';
import { TicketConflictError } from '@tickets/application/errors/ticket-conflict.error';
import { UserNotMemberError } from '@tickets/application/errors/user-not-member.error';
import { ValidationFailedError } from '@tickets/application/errors/validation-failed.error';
import { Ticket } from '@tickets/domain/entities/ticket.entity';
import { ExternalValidationPort } from '@tickets/domain/ports/external-validation.port';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTicketUseCase } from '../create-ticket.case';

describe('CreateTicketUseCase', () => {
	let createTicketUseCase: CreateTicketUseCase;
	let mockTicketRepository: TicketRepository;
	let mockExternalValidation: ExternalValidationPort;

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

		mockExternalValidation = {
			validateUser: vi.fn(),
			validateOrganization: vi.fn(),
			validateMembership: vi.fn(),
			validateUserAndOrganization: vi.fn(),
		} as unknown as ExternalValidationPort;

		createTicketUseCase = new CreateTicketUseCase(
			mockTicketRepository,
			mockExternalValidation,
		);
	});

	describe('execute - success cases', () => {
		it('should successfully create a ticket when all validations pass', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-123',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: ['Criteria 1'],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: ['test'],
				createdBy: 'user-123',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: true,
			});
			vi.mocked(mockExternalValidation.validateMembership).mockResolvedValue(
				true,
			);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([]);
			vi.mocked(mockTicketRepository.create).mockResolvedValue(mockTicket);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toEqual(mockTicket);
			}
			expect(
				mockExternalValidation.validateUserAndOrganization,
			).toHaveBeenCalledWith('user-123', 'org-123');
			expect(mockExternalValidation.validateMembership).toHaveBeenCalledWith(
				'user-123',
				'org-123',
			);
			expect(mockTicketRepository.create).toHaveBeenCalledWith(createTicketDto);
		});

		it('should create a ticket with an assignee when assignee is a member', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-123',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: 'assignee-123',
				difficulty: 'M',
				tags: [],
				createdBy: 'user-123',
			};

			const ticketWithAssignee = { ...mockTicket, assigneeId: 'assignee-123' };

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: true,
			});
			vi.mocked(mockExternalValidation.validateMembership).mockResolvedValue(
				true,
			);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([]);
			vi.mocked(mockTicketRepository.create).mockResolvedValue(
				ticketWithAssignee,
			);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.assigneeId).toBe('assignee-123');
			}
			// Should validate membership for both creator and assignee
			expect(mockExternalValidation.validateMembership).toHaveBeenCalledTimes(
				2,
			);
			expect(mockExternalValidation.validateMembership).toHaveBeenCalledWith(
				'user-123',
				'org-123',
			);
			expect(mockExternalValidation.validateMembership).toHaveBeenCalledWith(
				'assignee-123',
				'org-123',
			);
		});
	});

	describe('execute - validation failure cases', () => {
		it('should return ValidationFailedError when user does not exist', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-123',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: [],
				createdBy: 'invalid-user',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: false,
				organizationExists: true,
			});
			vi.mocked(mockTicketRepository.deleteByCreatorId).mockResolvedValue(5);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(ValidationFailedError);
				expect((result.error as ValidationFailedError).userValid).toBe(false);
				expect((result.error as ValidationFailedError).organizationValid).toBe(
					true,
				);
				expect((result.error as ValidationFailedError).deletedUserTickets).toBe(
					5,
				);
			}
			expect(mockTicketRepository.deleteByCreatorId).toHaveBeenCalledWith(
				'invalid-user',
			);
		});

		it('should return ValidationFailedError when organization does not exist', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'invalid-org',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: [],
				createdBy: 'user-123',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: false,
			});
			vi.mocked(mockTicketRepository.deleteByOrganizationId).mockResolvedValue(
				10,
			);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(ValidationFailedError);
				expect((result.error as ValidationFailedError).userValid).toBe(true);
				expect((result.error as ValidationFailedError).organizationValid).toBe(
					false,
				);
				expect((result.error as ValidationFailedError).deletedOrgTickets).toBe(
					10,
				);
			}
			expect(mockTicketRepository.deleteByOrganizationId).toHaveBeenCalledWith(
				'invalid-org',
			);
		});

		it('should return ValidationFailedError when both user and organization do not exist', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'invalid-org',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: [],
				createdBy: 'invalid-user',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: false,
				organizationExists: false,
			});
			vi.mocked(mockTicketRepository.deleteByCreatorId).mockResolvedValue(3);
			vi.mocked(mockTicketRepository.deleteByOrganizationId).mockResolvedValue(
				7,
			);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(ValidationFailedError);
				expect((result.error as ValidationFailedError).userValid).toBe(false);
				expect((result.error as ValidationFailedError).organizationValid).toBe(
					false,
				);
				expect((result.error as ValidationFailedError).deletedUserTickets).toBe(
					3,
				);
				expect((result.error as ValidationFailedError).deletedOrgTickets).toBe(
					7,
				);
			}
		});
	});

	describe('execute - membership failure cases', () => {
		it('should return UserNotMemberError when creator is not a member of the organization', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-123',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: [],
				createdBy: 'user-123',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: true,
			});
			vi.mocked(mockExternalValidation.validateMembership).mockResolvedValue(
				false,
			);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotMemberError);
				expect((result.error as UserNotMemberError).userId).toBe('user-123');
				expect((result.error as UserNotMemberError).organizationId).toBe(
					'org-123',
				);
				expect((result.error as UserNotMemberError).field).toBe('createdBy');
			}
		});

		it('should return UserNotMemberError when assignee is not a member of the organization', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-123',
				title: 'Test Ticket',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: 'non-member-assignee',
				difficulty: 'M',
				tags: [],
				createdBy: 'user-123',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: true,
			});
			// First call (creator) returns true, second call (assignee) returns false
			vi.mocked(mockExternalValidation.validateMembership)
				.mockResolvedValueOnce(true)
				.mockResolvedValueOnce(false);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(UserNotMemberError);
				expect((result.error as UserNotMemberError).userId).toBe(
					'non-member-assignee',
				);
				expect((result.error as UserNotMemberError).organizationId).toBe(
					'org-123',
				);
				expect((result.error as UserNotMemberError).field).toBe('assigneeId');
			}
		});
	});

	describe('execute - title conflict cases', () => {
		it('should return TicketConflictError when title already exists in organization', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-123',
				title: 'Existing Title',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: [],
				createdBy: 'user-123',
			};

			const existingTicket: Ticket = {
				...mockTicket,
				title: 'existing title', // Same title, different case
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: true,
			});
			vi.mocked(mockExternalValidation.validateMembership).mockResolvedValue(
				true,
			);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([
				existingTicket,
			]);

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(TicketConflictError);
			}
		});

		it('should allow creating ticket with same title in different organization', async () => {
			const createTicketDto: CreateTicketDto = {
				orgId: 'org-456',
				title: 'Existing Title',
				description: 'Test Description',
				acceptanceCriteria: [],
				status: 'Open',
				assigneeId: null,
				difficulty: 'M',
				tags: [],
				createdBy: 'user-123',
			};

			vi.mocked(
				mockExternalValidation.validateUserAndOrganization,
			).mockResolvedValue({
				userExists: true,
				organizationExists: true,
			});
			vi.mocked(mockExternalValidation.validateMembership).mockResolvedValue(
				true,
			);
			vi.mocked(mockTicketRepository.findAllByOrgId).mockResolvedValue([]); // No tickets in org-456
			vi.mocked(mockTicketRepository.create).mockResolvedValue({
				...mockTicket,
				orgId: 'org-456',
			});

			const result = await createTicketUseCase.execute(createTicketDto);

			expect(result.ok).toBe(true);
		});
	});
});
