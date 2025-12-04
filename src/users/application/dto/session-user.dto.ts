import { z } from 'zod';

export const sessionMembershipSchema = z.object({
	id: z.string(),
	organizationId: z.string(),
	role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

export type SessionMembershipDto = z.infer<typeof sessionMembershipSchema>;

export const sessionUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	authProvider: z.string(),
	role: z.enum(['user', 'admin', 'system']),
	memberships: z.array(sessionMembershipSchema),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type SessionUserDto = z.infer<typeof sessionUserSchema>;
