import { User } from '@auth/infrastructure/annotations/user.annotation';
import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class SessionRestController {
	@Get('me')
	getProfile(@User() user: unknown) {
		return { message: 'This is a protected route', user }; //TODO: Add guards
	}
}
