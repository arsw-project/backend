import { All, Controller, Next, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@ApiExcludeController()
@Controller()
export class ProxyController {
	constructor(private readonly proxyService: ProxyService) {}

	@All('/api/tickets')
	@All('/api/tickets/(.*)')
	proxyTickets(
		@Req() req: Request,
		@Res() res: Response,
		@Next() _next: NextFunction,
	) {
		return this.proxyService.proxyTicketsRequest(req, res);
	}

	@All('/api/video-call')
	@All('/api/video-call/(.*)')
	proxyVideoCall(
		@Req() req: Request,
		@Res() res: Response,
		@Next() _next: NextFunction,
	) {
		return this.proxyService.proxyVideoCallRequest(req, res);
	}
}
