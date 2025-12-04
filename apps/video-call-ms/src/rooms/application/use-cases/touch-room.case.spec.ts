import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TouchRoomUseCase } from './touch-room.case';

describe('TouchRoomUseCase', () => {
	let useCase: TouchRoomUseCase;
	let roomRepository: RoomRepository;

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

		useCase = new TouchRoomUseCase(roomRepository);
	});

	describe('execute', () => {
		it('should touch room to update activity timestamp', () => {
			// Act
			useCase.execute('ticket-123');

			// Assert
			expect(roomRepository.touch).toHaveBeenCalledWith('ticket-123');
			expect(roomRepository.touch).toHaveBeenCalledTimes(1);
		});

		it('should handle non-existent room gracefully', () => {
			// Act - should not throw
			expect(() => useCase.execute('non-existent')).not.toThrow();

			// Assert
			expect(roomRepository.touch).toHaveBeenCalledWith('non-existent');
		});

		it('should be called with correct ticket ID', () => {
			// Act
			useCase.execute('specific-ticket-id');

			// Assert
			expect(roomRepository.touch).toHaveBeenCalledWith('specific-ticket-id');
		});
	});
});
