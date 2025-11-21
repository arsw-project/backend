import { z } from 'zod';

export const createUserSchema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		email: z.email('Invalid email address'),
		password: z.string().min(1, 'Password is required'),
		authProvider: z.enum(
			['local', 'google'],
			'Auth provider must be either local or google',
		),
		providerId: z.string().nullable(),
	})
	.required();

export type CreateUserDto = z.infer<typeof createUserSchema>;
