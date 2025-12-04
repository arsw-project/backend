import { z } from 'zod';

export const sendChatMessageSchema = z.object({
	content: z
		.string()
		.min(1, 'Message content is required')
		.max(2000, 'Message content must be at most 2000 characters'),
});

export type SendChatMessageDto = z.infer<typeof sendChatMessageSchema>;
