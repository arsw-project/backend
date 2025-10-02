import type { LoginUserDto } from '@auth/application/dto/login-user.dto';
import { loginUserSchema } from '@auth/application/dto/login-user.dto';
import { LoginEmailUserUseCase } from '@auth/application/use-cases/login-email-user.case';
import { User } from '@auth/infrastructure/annotations/user.annotation';
import { AuthGuard } from '@auth/infrastructure/guards/auth.guard';
import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	Post,
	UnauthorizedException,
	UseGuards,
	UsePipes,
} from '@nestjs/common';
import type { SessionUserDto } from '@users/application/dto/session-user.dto';

@Controller('auth')
export class SessionRestController {
	constructor(private readonly loginEmailUserUseCase: LoginEmailUserUseCase) {}

	@Get('me')
	@UseGuards(AuthGuard)
	getProfile(@User() user: SessionUserDto) {
		return { user };
	}

	@Post('login')
	@UsePipes(new ZodValidationPipe(loginUserSchema))
	async login(@Body() body: LoginUserDto) {
		const result = await this.loginEmailUserUseCase.execute(body);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException(); // Handle unexpected errors
			}

			switch (error.code) {
				case 'USER_NOT_FOUND':
				case 'INVALID_CREDENTIALS':
					throw new UnauthorizedException({
						message: error.message,
						code: error.code,
						errors: error.issues,
					});
			}

			throw new InternalServerErrorException(); // Fallback for unhandled application errors
		}

		return { token: result.value.token, user: result.value.user };
	}
}
