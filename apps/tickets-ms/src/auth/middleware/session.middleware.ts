import {
	RequestWithUser,
	SessionUser,
} from '@auth/interfaces/request-with-user.interface';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { firstValueFrom } from 'rxjs';

interface ValidateSessionResponse {
	valid: boolean;
	user?: SessionUser;
}

/**
 * Middleware que valida el token de sesión contra el monolito.
 *
 * Lee el token de sesión de las cookies o del header Authorization
 * y lo valida usando el endpoint interno del monolito.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
	private readonly logger = new Logger(SessionMiddleware.name);
	private readonly monolithUrl: string;
	private readonly serviceToken: string;

	constructor(private readonly httpService: HttpService) {
		this.monolithUrl = process.env.MONOLITH_URL || 'http://localhost:3000';
		this.serviceToken = process.env.SERVICE_SECRET_KEY || '';
	}

	async use(req: RequestWithUser, _res: Response, next: NextFunction) {
		// Intentar obtener el token de la cookie o del header
		const sessionToken =
			req.cookies?.['session-token'] ||
			this.extractBearerToken(req.headers.authorization);

		if (!sessionToken) {
			req.user = null;
			return next();
		}

		try {
			const response = await firstValueFrom(
				this.httpService.get<ValidateSessionResponse>(
					`${this.monolithUrl}/internal/sessions/${encodeURIComponent(sessionToken)}/validate`,
					{
						headers: {
							'X-Service-Token': this.serviceToken,
						},
					},
				),
			);

			if (response.data?.valid && response.data?.user) {
				req.user = response.data.user;
			} else {
				req.user = null;
			}
		} catch (error) {
			this.logger.warn(`Error validating session: ${error.message}`);
			req.user = null;
		}

		return next();
	}

	private extractBearerToken(authHeader?: string): string | null {
		if (!authHeader?.startsWith('Bearer ')) {
			return null;
		}
		return authHeader.slice(7);
	}
}
