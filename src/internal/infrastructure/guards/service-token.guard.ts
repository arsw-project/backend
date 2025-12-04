import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard que valida el X-Service-Token header para comunicación entre servicios.
 *
 * Solo permite el acceso si el token coincide con SERVICE_SECRET_KEY.
 */
@Injectable()
export class ServiceTokenGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const serviceToken = request.headers['x-service-token'];

		const expectedToken = process.env.SERVICE_SECRET_KEY;

		if (!expectedToken) {
			throw new UnauthorizedException('Service token not configured on server');
		}

		if (!serviceToken || serviceToken !== expectedToken) {
			throw new UnauthorizedException('Invalid service token');
		}

		return true;
	}
}
