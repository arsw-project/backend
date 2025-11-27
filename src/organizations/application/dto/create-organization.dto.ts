import { z } from 'zod';

export const createOrganizationSchema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		description: z.string().min(1, 'Description is required'),
	})
	.required();

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
