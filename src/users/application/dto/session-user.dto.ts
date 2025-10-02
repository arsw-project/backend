import { z } from 'zod';

export const sessionUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
	authProvider: z.string(),
	providerId: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type SessionUserDto = z.infer<typeof sessionUserSchema>;
