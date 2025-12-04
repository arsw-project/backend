import { RequestWithUser } from '@auth/interfaces/request-with-user.interface';
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard que verifica si el usuario está autenticado.
 * Lanza UnauthorizedException (401) si no hay usuario en el request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<RequestWithUser>();

		if (!request.user) {
			throw new UnauthorizedException({
				message: 'Authentication required',
				code: 'UNAUTHORIZED',
			});
		}

		return true;
	}
}
