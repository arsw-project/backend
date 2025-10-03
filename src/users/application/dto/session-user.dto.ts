import { z } from 'zod';

export const sessionUserSchema = z.object({
	name: z.string(),
	email: z.email(),
	authProvider: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type SessionUserDto = z.infer<typeof sessionUserSchema>;
