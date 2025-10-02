import { GetSessionUseCase } from '@auth/application/use-cases/get-session.case';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { SessionUserDto } from '@users/application/dto/session-user.dto';
import { NextFunction, Request, Response } from 'express';

interface RequestWithUser extends Request {
	user: SessionUserDto | null;
}

@Injectable()
export class SessionMiddleware implements NestMiddleware {
	constructor(private readonly getSessionUseCase: GetSessionUseCase) {}

	async use(req: RequestWithUser, _res: Response, next: NextFunction) {
		const sessionId = req.cookies['session-token'];

		if (!sessionId) {
			req.user = null;
			return next();
		}

		const session = await this.getSessionUseCase.execute(sessionId);

		if (!session.ok) {
			req.user = null;
			return next();
		}

		req.user = session.value.user;

		return next();
	}
}
