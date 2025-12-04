import { z } from 'zod';

export const validateMembershipSchema = z.object({
	userId: z.string().uuid('User ID must be a valid UUID'),
	ticketId: z.string().uuid('Ticket ID must be a valid UUID'),
});

export type ValidateMembershipDto = z.infer<typeof validateMembershipSchema>;
