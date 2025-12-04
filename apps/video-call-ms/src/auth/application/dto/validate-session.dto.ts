import { z } from 'zod';

export const validateSessionSchema = z.object({
	sessionToken: z.string().min(1, 'Session token is required'),
});

export type ValidateSessionDto = z.infer<typeof validateSessionSchema>;
