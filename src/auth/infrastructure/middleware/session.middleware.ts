import { GetSessionUseCase } from '@auth/application/use-cases/get-session.case';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { SessionUserDto } from '@users/application/dto/session-user.dto';
import { NextFunction, Request, Response } from 'express';

export interface RequestWithUser extends Request {
	user: SessionUserDto | null;
}

@Injectable()
export class SessionMiddleware implements NestMiddleware {
	constructor(private readonly getSessionUseCase: GetSessionUseCase) {}

	private extractBearerToken(authHeader?: string): string | null {
		if (!authHeader) return null;
		const matches = authHeader.match(/^Bearer (.+)$/);
		return matches ? matches[1] : null;
	}

	async use(req: RequestWithUser, _res: Response, next: NextFunction) {
		const sessionId =
			req.cookies['session-token'] ||
			this.extractBearerToken(req.headers.authorization);

		if (!sessionId) {
			req.user = null;
			return next();
		}

		const session = await this.getSessionUseCase.execute(sessionId);

		console.log(`Session validation result for token ${sessionId}:`, session);

		if (!session.ok) {
			req.user = null;
			return next();
		}

		req.user = session.value.user;

		return next();
	}
}
