import type { SessionUser } from '@auth/domain/entities/session-user.entity';
import type { Participant, Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ParticipantNotFoundError } from '../errors/room.errors';
import { LeaveRoomUseCase } from './leave-room.case';

describe('LeaveRoomUseCase', () => {
	let useCase: LeaveRoomUseCase;
	let roomRepository: RoomRepository;
	let socketToRoomMap: Map<string, string>;

	const mockUser: SessionUser = {
		id: 'user-123',
		name: 'Test User',
		email: 'test@example.com',
		role: 'user',
	};

	const mockRoom: Room = {
		ticketId: 'ticket-123',
		orgId: 'org-123',
		createdAt: new Date('2024-01-01'),
		lastActivityAt: new Date('2024-01-01'),
		inactivityTimeoutMs: 30 * 60 * 1000,
		participants: new Map(),
	};

	const mockParticipant: Participant = {
		socketId: 'socket-123',
		user: mockUser,
		joinedAt: new Date('2024-01-01'),
	};

	beforeEach(() => {
		roomRepository = {
			create: vi.fn(),
			findByTicketId: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			addParticipant: vi.fn(),
			removeParticipant: vi.fn(),
			getParticipant: vi.fn(),
			getAllParticipants: vi.fn(),
			getOtherParticipants: vi.fn(),
			getParticipantCount: vi.fn(),
			isRoomEmpty: vi.fn(),
			touch: vi.fn(),
			isInactive: vi.fn(),
			getTimeUntilInactive: vi.fn(),
		} as unknown as RoomRepository;

		socketToRoomMap = new Map();
		socketToRoomMap.set('socket-123', 'ticket-123');

		useCase = new LeaveRoomUseCase(roomRepository, socketToRoomMap);
	});

	describe('execute', () => {
		it('should leave room successfully when participant exists', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.removeParticipant).mockReturnValue(
				mockParticipant,
			);
			vi.mocked(roomRepository.isRoomEmpty).mockReturnValue(false);

			// Act
			const result = useCase.execute('socket-123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.participant).toEqual(mockParticipant);
				expect(result.value.roomClosed).toBe(false);
				expect(result.value.ticketId).toBe('ticket-123');
			}
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
			expect(roomRepository.removeParticipant).toHaveBeenCalledWith(
				'ticket-123',
				'socket-123',
			);
			expect(socketToRoomMap.has('socket-123')).toBe(false);
		});

		it('should close room when last participant leaves', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.removeParticipant).mockReturnValue(
				mockParticipant,
			);
			vi.mocked(roomRepository.isRoomEmpty).mockReturnValue(true);
			vi.mocked(roomRepository.delete).mockReturnValue(true);

			// Act
			const result = useCase.execute('socket-123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.roomClosed).toBe(true);
			}
			expect(roomRepository.delete).toHaveBeenCalledWith('ticket-123');
		});

		it('should return error when socket is not in any room', () => {
			// Arrange - socket not in map

			// Act
			const result = useCase.execute('unknown-socket');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(ParticipantNotFoundError);
				expect(result.error.code).toBe('PARTICIPANT_NOT_FOUND');
			}
			expect(roomRepository.findByTicketId).not.toHaveBeenCalled();
		});

		it('should return error when room no longer exists', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(undefined);

			// Act
			const result = useCase.execute('socket-123');

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(ParticipantNotFoundError);
			}
			expect(socketToRoomMap.has('socket-123')).toBe(false);
		});

		it('should not close room when other participants remain', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.removeParticipant).mockReturnValue(
				mockParticipant,
			);
			vi.mocked(roomRepository.isRoomEmpty).mockReturnValue(false);

			// Act
			const result = useCase.execute('socket-123');

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value.roomClosed).toBe(false);
			}
			expect(roomRepository.delete).not.toHaveBeenCalled();
		});

		it('should clean up socket mapping even when leaving', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);
			vi.mocked(roomRepository.removeParticipant).mockReturnValue(
				mockParticipant,
			);
			vi.mocked(roomRepository.isRoomEmpty).mockReturnValue(false);

			expect(socketToRoomMap.has('socket-123')).toBe(true);

			// Act
			useCase.execute('socket-123');

			// Assert
			expect(socketToRoomMap.has('socket-123')).toBe(false);
		});
	});
});
