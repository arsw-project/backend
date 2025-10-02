import { User } from '@auth/infrastructure/annotations/user.annotation';
import { AuthGuard } from '@auth/infrastructure/guards/auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import type { SessionUserDto } from '@users/application/dto/session-user.dto';

@Controller('auth')
export class SessionRestController {
	@Get('me')
	@UseGuards(AuthGuard)
	getProfile(@User() user: SessionUserDto) {
		return { user };
	}
}
