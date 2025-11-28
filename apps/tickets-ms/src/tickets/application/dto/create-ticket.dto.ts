import { z } from 'zod';

export const createTicketSchema = z.object({
	orgId: z.string().uuid(),
	title: z.string().min(1, 'Title is required'),
	description: z.string().min(1, 'Description is required'),
	acceptanceCriteria: z
		.array(z.string())
		.min(1, 'Acceptance criteria is required'),
	status: z.enum(['Open', 'In Progress', 'Done']).default('Open'),
	assigneeId: z.string().uuid().nullable().optional(),
	difficulty: z.enum(['S', 'M', 'L']),
	tags: z.array(z.string()).min(1, 'At least one tag is required'),
	createdBy: z.string().uuid(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
