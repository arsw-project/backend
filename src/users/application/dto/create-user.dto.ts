import { z } from 'zod';

export const createUserSchema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		email: z.email('Invalid email address'),
		password: z.string().min(1, 'Password is required'),
		authProvider: z.string().min(1, 'Auth provider is required'),
		providerId: z.string().nullable(),
	})
	.required();

export type CreateUserDto = z.infer<typeof createUserSchema>;
