import { LoginGoogleUserUseCase } from '@auth/application/use-cases/login-google-user.case';
import { ArcticService } from '@auth/infrastructure/clients/arctic.client';
import {
	BadRequestException,
	Controller,
	Get,
	HttpRedirectResponse,
	Logger,
	Redirect,
	Req,
	Res,
} from '@nestjs/common';
import { decodeIdToken, OAuth2Tokens } from 'arctic';
import type { Request, Response } from 'express';

interface GoogleIdTokenClaims {
	iss: string;
	sub: string;
	email: string;
	name: string;
	picture: string;
}

@Controller('auth/google')
export class GoogleRestController {
	private readonly logger = new Logger(GoogleRestController.name);

	constructor(
		private readonly arcticService: ArcticService,
		private readonly loginGoogleUserUseCase: LoginGoogleUserUseCase,
	) {}

	@Get('login')
	@Redirect()
	emailLogin(@Res({ passthrough: true }) response: Response) {
		const { codeVerifier, state, url } =
			this.arcticService.createGoogleAuthURL();

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
			tokens = await this.arcticService.googleClient.validateAuthorizationCode(
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

		response.cookie('session_token', session.value.token, {
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
	emailLogout() {}
}
