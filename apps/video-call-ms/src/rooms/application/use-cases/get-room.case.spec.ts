import type { Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetRoomUseCase } from './get-room.case';

describe('GetRoomUseCase', () => {
	let useCase: GetRoomUseCase;
	let roomRepository: RoomRepository;
	let socketToRoomMap: Map<string, string>;

	const mockRoom: Room = {
		ticketId: 'ticket-123',
		orgId: 'org-123',
		createdAt: new Date('2024-01-01'),
		lastActivityAt: new Date('2024-01-01'),
		inactivityTimeoutMs: 30 * 60 * 1000,
		participants: new Map(),
	};

	const mockRooms: Room[] = [
		mockRoom,
		{
			ticketId: 'ticket-456',
			orgId: 'org-456',
			createdAt: new Date('2024-01-02'),
			lastActivityAt: new Date('2024-01-02'),
			inactivityTimeoutMs: 30 * 60 * 1000,
			participants: new Map(),
		},
	];

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

		useCase = new GetRoomUseCase(roomRepository, socketToRoomMap);
	});

	describe('byTicketId', () => {
		it('should return room when it exists', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);

			// Act
			const result = useCase.byTicketId('ticket-123');

			// Assert
			expect(result).toEqual(mockRoom);
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
		});

		it('should return undefined when room does not exist', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(undefined);

			// Act
			const result = useCase.byTicketId('non-existent');

			// Assert
			expect(result).toBeUndefined();
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith(
				'non-existent',
			);
		});
	});

	describe('bySocketId', () => {
		it('should return room when socket is in a room', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(mockRoom);

			// Act
			const result = useCase.bySocketId('socket-123');

			// Assert
			expect(result).toEqual(mockRoom);
			expect(roomRepository.findByTicketId).toHaveBeenCalledWith('ticket-123');
		});

		it('should return undefined when socket is not in any room', () => {
			// Act
			const result = useCase.bySocketId('unknown-socket');

			// Assert
			expect(result).toBeUndefined();
			expect(roomRepository.findByTicketId).not.toHaveBeenCalled();
		});

		it('should return undefined when room no longer exists', () => {
			// Arrange
			vi.mocked(roomRepository.findByTicketId).mockReturnValue(undefined);

			// Act
			const result = useCase.bySocketId('socket-123');

			// Assert
			expect(result).toBeUndefined();
		});
	});

	describe('getTicketIdForSocket', () => {
		it('should return ticket ID when socket is mapped', () => {
			// Act
			const result = useCase.getTicketIdForSocket('socket-123');

			// Assert
			expect(result).toBe('ticket-123');
		});

		it('should return undefined when socket is not mapped', () => {
			// Act
			const result = useCase.getTicketIdForSocket('unknown-socket');

			// Assert
			expect(result).toBeUndefined();
		});
	});

	describe('getAll', () => {
		it('should return all active rooms', () => {
			// Arrange
			vi.mocked(roomRepository.getAll).mockReturnValue(mockRooms);

			// Act
			const result = useCase.getAll();

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toEqual(mockRooms);
			expect(result.value).toHaveLength(2);
			expect(roomRepository.getAll).toHaveBeenCalledTimes(1);
		});

		it('should return empty array when no rooms exist', () => {
			// Arrange
			vi.mocked(roomRepository.getAll).mockReturnValue([]);

			// Act
			const result = useCase.getAll();

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value).toEqual([]);
			expect(result.value).toHaveLength(0);
		});
	});
});
