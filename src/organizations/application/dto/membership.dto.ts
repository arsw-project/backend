import { z } from 'zod';

export const addMemberSchema = z
	.object({
		userId: z.string().uuid('Invalid user ID format'),
		role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
	})
	.required();

export type AddMemberDto = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
	role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
