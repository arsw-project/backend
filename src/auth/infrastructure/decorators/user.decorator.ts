import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user || null;

		return user;
	},
);
