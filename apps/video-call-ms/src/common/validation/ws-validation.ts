import { z } from 'zod';

type ValidationSuccess<T> = {
	success: true;
	data: T;
};

type ValidationError = {
	success: false;
	errors: string[];
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Validates WebSocket payloads using Zod schemas.
 * Returns a result object with success/error status.
 */
export function validateWsPayload<T>(
	payload: unknown,
	schema: z.ZodType<T>,
): ValidationResult<T> {
	const result = schema.safeParse(payload);

	if (!result.success) {
		const errors = formatZodErrors(result.error);
		return {
			success: false,
			errors,
		};
	}

	return {
		success: true,
		data: result.data,
	};
}

function formatZodErrors(error: z.ZodError): string[] {
	return error.issues.map((issue) => {
		const path = issue.path.join('.');
		return path ? `${path}: ${issue.message}` : issue.message;
	});
}
