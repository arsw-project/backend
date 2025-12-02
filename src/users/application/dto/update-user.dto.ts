import { z } from 'zod';

export const updateUserSchema = z
	.object({
		name: z.string().min(1, 'Name is required').optional(),
		email: z.email('Invalid email address').optional(),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.optional(),
		role: z.enum(['user', 'admin', 'system']).optional(),
	})
	.strict();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
