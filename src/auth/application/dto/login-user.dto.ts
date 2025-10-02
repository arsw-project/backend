import { z } from 'zod';

export const loginUserSchema = z
	.object({
		email: z.email('Invalid email address'),
		password: z.string().min(1, 'Password is required'),
	})
	.required();

export type LoginUserDto = z.infer<typeof loginUserSchema>;
