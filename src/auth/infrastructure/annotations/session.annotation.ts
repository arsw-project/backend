import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Session = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const sessionToken = request.cookies['session-token'] || null;

		return sessionToken;
	},
);
