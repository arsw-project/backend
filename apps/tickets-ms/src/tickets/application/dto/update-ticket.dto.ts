import { z } from 'zod';

export const updateTicketSchema = z
	.object({
		title: z.string().min(1, 'Title is required').optional(),
		description: z.string().min(1, 'Description is required').optional(),
		acceptanceCriteria: z
			.array(z.string())
			.min(1, 'Acceptance criteria is required')
			.optional(),
		status: z.enum(['Open', 'In Progress', 'Done']).optional(),
		assigneeId: z.string().uuid().nullable().optional(),
		difficulty: z.enum(['S', 'M', 'L']).optional(),
		tags: z.array(z.string()).min(1, 'At least one tag is required').optional(),
	})
	.partial();

export type UpdateTicketDto = z.infer<typeof updateTicketSchema>;
