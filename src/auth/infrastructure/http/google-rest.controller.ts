import { LoginGoogleUserUseCase } from '@auth/application/use-cases/login-google-user.case';
import { ArcticClient } from '@auth/infrastructure/clients/arctic.client';
import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import {
	BadRequestException,
	Controller,
	Get,
	HttpRedirectResponse,
	Redirect,
	Req,
	Res,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiExcludeEndpoint,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { decodeIdToken, OAuth2Tokens } from 'arctic';
import type { Request, Response } from 'express';
import { GoogleOAuthErrorDto } from '../swagger/google-auth.swagger';

interface GoogleIdTokenClaims {
	iss: string;
	sub: string;
	email: string;
	name: string;
	picture: string;
}

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleRestController {
	constructor(
		private readonly arcticClient: ArcticClient,
		private readonly loginGoogleUserUseCase: LoginGoogleUserUseCase,
		private readonly logger: LoggerPort,
	) {}

	@Get('login')
	@Redirect()
	@ApiOperation({
		summary: 'Iniciar autenticación con Google',
		description:
			'Redirige al usuario a la página de autenticación de Google OAuth 2.0. Establece cookies temporales para el flujo PKCE.',
	})
	@ApiResponse({
		status: 302,
		description: 'Redirección a Google OAuth',
		headers: {
			Location: {
				description: 'URL de autenticación de Google',
				schema: { type: 'string' },
			},
			'Set-Cookie': {
				description: 'Cookies de estado OAuth y code verifier',
				schema: { type: 'string' },
			},
		},
	})
	emailLogin(@Res({ passthrough: true }) response: Response) {
		const { codeVerifier, state, url } =
			this.arcticClient.createGoogleAuthURL();

		response.cookie('google_oauth_state', state, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 10 * 1000, // 10 minutes
			sameSite: 'lax',
		});

		response.cookie('google_code_verifier', codeVerifier, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 10 * 1000, // 10 minutes
			sameSite: 'lax',
		});

		const redirect: HttpRedirectResponse = {
			url: url.toString(),
			statusCode: 302,
		};

		return redirect;
	}

	@Get('login/callback')
	@Redirect()
	@ApiOperation({
		summary: 'Callback de autenticación Google',
		description:
			'Endpoint de callback para el flujo OAuth de Google. Valida el código de autorización, crea o recupera el usuario, y establece la cookie de sesión.',
	})
	@ApiResponse({
		status: 302,
		description:
			'Redirección exitosa a la aplicación cliente con sesión establecida',
		headers: {
			Location: {
				description: 'URL de redirección configurada en GOOGLE_LOGIN_REDIRECT',
				schema: { type: 'string' },
			},
			'Set-Cookie': {
				description: 'Cookie de sesión HTTP-only',
				schema: { type: 'string' },
			},
		},
	})
	@ApiBadRequestResponse({
		description:
			'Parámetros faltantes, estado inválido o error al validar código',
		type: GoogleOAuthErrorDto,
	})
	async emailLoginCallback(
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
	) {
		const url = new URL(`${process.env.HOST || 'localhost'}${request.url}`);
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
		const cookies = request.cookies;

		const storedState = cookies.google_oauth_state;
		const codeVerifier = cookies.google_code_verifier;

		if (!code || !state || !storedState || !codeVerifier) {
			return new BadRequestException('Missing required parameters or cookies');
		}

		if (state !== storedState) {
			return new BadRequestException('Invalid state parameter');
		}

		let tokens: OAuth2Tokens;
		try {
			tokens = await this.arcticClient.googleClient.validateAuthorizationCode(
				code,
				codeVerifier,
			);
		} catch (error) {
			this.logger.error('Failed to validate authorization code', error);
			throw new BadRequestException('Failed to validate authorization code');
		}

		const claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims;

		const session = await this.loginGoogleUserUseCase.execute({
			email: claims.email,
			name: claims.name,
			googleUserId: claims.sub,
		});

		response.clearCookie('google_oauth_state', { path: '/' });
		response.clearCookie('google_code_verifier', { path: '/' });

		response.cookie('session-token', session.value.token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 1000, // 24 hours
			sameSite: 'lax',
		});

		const redirect: HttpRedirectResponse = {
			url: `${process.env.GOOGLE_LOGIN_REDIRECT}/`,
			statusCode: 302,
		};

		return redirect;
	}

	@Get('logout')
	@ApiExcludeEndpoint()
	emailLogout() {}
}
