import { z } from 'zod';

export const createUserSchema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		email: z.email('Invalid email address'),
		password: z.string().min(1, 'Password is required'),
		providerId: z.string().optional(),
	})
	.required();

export type CreateUserDto = z.infer<typeof createUserSchema>;
