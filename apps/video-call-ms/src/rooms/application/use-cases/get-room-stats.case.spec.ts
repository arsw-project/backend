import type { Room } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetRoomStatsUseCase } from './get-room-stats.case';

describe('GetRoomStatsUseCase', () => {
	let useCase: GetRoomStatsUseCase;
	let roomRepository: RoomRepository;

	const mockRooms: Room[] = [
		{
			ticketId: 'ticket-1',
			orgId: 'org-1',
			createdAt: new Date('2024-01-01'),
			lastActivityAt: new Date('2024-01-01T10:00:00'),
			inactivityTimeoutMs: 30 * 60 * 1000,
			participants: new Map(),
		},
		{
			ticketId: 'ticket-2',
			orgId: 'org-2',
			createdAt: new Date('2024-01-02'),
			lastActivityAt: new Date('2024-01-02T10:00:00'),
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

		useCase = new GetRoomStatsUseCase(roomRepository);
	});

	describe('execute', () => {
		it('should return stats for all rooms', () => {
			// Arrange
			vi.mocked(roomRepository.getAll).mockReturnValue(mockRooms);
			vi.mocked(roomRepository.getParticipantCount)
				.mockReturnValueOnce(2) // First room - for totalParticipants
				.mockReturnValueOnce(3) // Second room - for totalParticipants
				.mockReturnValueOnce(2) // First room - for rooms array
				.mockReturnValueOnce(3); // Second room - for rooms array
			vi.mocked(roomRepository.getTimeUntilInactive)
				.mockReturnValueOnce(1500000)
				.mockReturnValueOnce(1200000);

			// Act
			const result = useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.totalRooms).toBe(2);
			expect(result.value.totalParticipants).toBe(5);
			expect(result.value.rooms).toHaveLength(2);
			expect(result.value.rooms[0]).toEqual({
				ticketId: 'ticket-1',
				participants: 2,
				createdAt: mockRooms[0].createdAt,
				lastActivity: mockRooms[0].lastActivityAt,
				timeUntilInactive: 1500000,
			});
		});

		it('should return empty stats when no rooms exist', () => {
			// Arrange
			vi.mocked(roomRepository.getAll).mockReturnValue([]);

			// Act
			const result = useCase.execute();

			// Assert
			expect(result.ok).toBe(true);
			expect(result.value.totalRooms).toBe(0);
			expect(result.value.totalParticipants).toBe(0);
			expect(result.value.rooms).toEqual([]);
		});

		it('should calculate total participants across all rooms', () => {
			// Arrange
			vi.mocked(roomRepository.getAll).mockReturnValue(mockRooms);
			vi.mocked(roomRepository.getParticipantCount)
				.mockReturnValueOnce(5)
				.mockReturnValueOnce(3)
				.mockReturnValueOnce(5)
				.mockReturnValueOnce(3);
			vi.mocked(roomRepository.getTimeUntilInactive).mockReturnValue(1000000);

			// Act
			const result = useCase.execute();

			// Assert
			expect(result.value.totalParticipants).toBe(8);
		});

		it('should include room details in stats', () => {
			// Arrange
			const singleRoom = [mockRooms[0]];
			vi.mocked(roomRepository.getAll).mockReturnValue(singleRoom);
			vi.mocked(roomRepository.getParticipantCount).mockReturnValue(4);
			vi.mocked(roomRepository.getTimeUntilInactive).mockReturnValue(900000);

			// Act
			const result = useCase.execute();

			// Assert
			expect(result.value.rooms[0].ticketId).toBe('ticket-1');
			expect(result.value.rooms[0].participants).toBe(4);
			expect(result.value.rooms[0].timeUntilInactive).toBe(900000);
		});
	});
});
