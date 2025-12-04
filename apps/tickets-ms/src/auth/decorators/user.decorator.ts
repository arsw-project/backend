import {
	RequestWithUser,
	SessionUser,
} from '@auth/interfaces/request-with-user.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el usuario autenticado del request.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(AuthGuard)
 * getProfile(@User() user: SessionUser) {
 *   return { user };
 * }
 * ```
 */
export const User = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): SessionUser | null => {
		const request = ctx.switchToHttp().getRequest<RequestWithUser>();
		return request.user || null;
	},
);
