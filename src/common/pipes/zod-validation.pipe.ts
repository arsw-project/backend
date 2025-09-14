import {
	ArgumentMetadata,
	BadRequestException,
	PipeTransform,
} from '@nestjs/common';
import { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
	constructor(private schema: ZodType) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		const parsedValue = this.schema.safeParse(value);

		if (!parsedValue.success) {
			throw new BadRequestException({
				message: 'Invalid request data',
				errors: parsedValue.error.issues,
			});
		}

		return parsedValue.data;
	}
}
