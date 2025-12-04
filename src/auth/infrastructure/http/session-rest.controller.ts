import type { LoginUserDto } from '@auth/application/dto/login-user.dto';
import { loginUserSchema } from '@auth/application/dto/login-user.dto';
import { DeleteSessionUseCase } from '@auth/application/use-cases/delete-session.case';
import { LoginEmailUserUseCase } from '@auth/application/use-cases/login-email-user.case';
import { Session } from '@auth/infrastructure/decorators/session.decorator';
import { User } from '@auth/infrastructure/decorators/user.decorator';
import { AuthGuard } from '@auth/infrastructure/guards/auth.guard';
import { ApplicationError } from '@common/errors/application.error';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
	InternalServerErrorDto,
	NotFoundErrorDto,
	UnauthorizedErrorDto,
} from '@common/swagger/api-error.dto';
import {
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	Post,
	Res,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBody,
	ApiCookieAuth,
	ApiInternalServerErrorResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { SessionUserDto } from '@users/application/dto/session-user.dto';
import type { Response } from 'express';
import {
	GetProfileResponseDto,
	LoginRequestDto,
	LoginResponseDto,
	LogoutResponseDto,
} from '../swagger/auth.swagger';

@ApiTags('Auth')
@Controller('auth')
export class SessionRestController {
	constructor(
		private readonly loginEmailUserUseCase: LoginEmailUserUseCase,
		private readonly deleteSessionUseCase: DeleteSessionUseCase,
	) {}

	@Get('me')
	@UseGuards(AuthGuard)
	@ApiCookieAuth('session-token')
	@ApiOperation({
		summary: 'Obtener perfil del usuario autenticado',
		description: 'Retorna la información del usuario autenticado actualmente',
	})
	@ApiResponse({
		status: 200,
		description: 'Perfil del usuario obtenido exitosamente',
		type: GetProfileResponseDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado - Token de sesión inválido o expirado',
		type: UnauthorizedErrorDto,
	})
	getProfile(@User() user: SessionUserDto) {
		return { user };
	}

	@Post('login')
	@ApiOperation({
		summary: 'Iniciar sesión con email y contraseña',
		description: 'Autentica al usuario y establece una cookie de sesión',
	})
	@ApiBody({ type: LoginRequestDto })
	@ApiResponse({
		status: 201,
		description: 'Inicio de sesión exitoso. Se establece cookie session-token',
		type: LoginResponseDto,
		headers: {
			'Set-Cookie': {
				description: 'Cookie de sesión HTTP-only',
				schema: { type: 'string' },
			},
		},
	})
	@ApiUnauthorizedResponse({
		description: 'Credenciales inválidas',
		type: UnauthorizedErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async login(
		@Body(new ZodValidationPipe(loginUserSchema)) body: LoginUserDto,
		@Res({ passthrough: true }) response: Response,
	) {
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

		response.cookie('session-token', result.value.token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 1000, // 24 hours
			sameSite: 'lax',
		});

		return { user: result.value.user };
	}
	@Post('logout')
	@UseGuards(AuthGuard)
	@ApiCookieAuth('session-token')
	@ApiOperation({
		summary: 'Cerrar sesión',
		description: 'Invalida la sesión actual y elimina la cookie de sesión',
	})
	@ApiResponse({
		status: 200,
		description: 'Sesión cerrada exitosamente',
		type: LogoutResponseDto,
	})
	@ApiNotFoundResponse({
		description: 'Sesión no encontrada',
		type: NotFoundErrorDto,
	})
	@ApiUnauthorizedResponse({
		description: 'No autenticado',
		type: UnauthorizedErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async logout(
		@Session() sessionToken: string,
		@Res({
			passthrough: true,
		})
		res: Response,
	) {
		if (!sessionToken) {
			res.status(400).json({ message: 'No session token found' });
			return;
		}

		const result = await this.deleteSessionUseCase.execute(sessionToken);

		if (!result.ok) {
			const error = result.error;

			if (!ApplicationError.isApplicationError(error)) {
				throw new InternalServerErrorException();
			}

			switch (error.code) {
				case 'SESSION_NOT_FOUND':
					res.status(404).json({
						message: error.message,
						code: error.code,
					});
					return;
			}

			throw new InternalServerErrorException();
		}

		res.clearCookie('session-token');
		res.json({ message: 'Logged out successfully' });
	}
}
