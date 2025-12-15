import { z } from 'zod';

export const joinRoomSchema = z.object({
	ticketId: z.string().uuid('Ticket ID must be a valid UUID'),
	sessionToken: z.string().min(1, 'Session token is required').optional(),
});

export type JoinRoomDto = z.infer<typeof joinRoomSchema>;
