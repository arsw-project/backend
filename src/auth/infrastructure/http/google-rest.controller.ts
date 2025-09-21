import { ArcticService } from '@auth/infrastructure/services/arctic.service';
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
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
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
		private readonly userRepository: UserRepository,
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
	async emailLoginCallback(@Req() request: Request) {
		const url = new URL(`http://localhost${request.url}`);
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
		const googleUserId = claims.sub;
		const email = claims.email;
		const name = claims.name;

		const existingUser = await this.userRepository.findByProviderId(
			'google',
			googleUserId,
		);

		if (existingUser) {
			return { message: 'User logged in successfully', user: existingUser };
		}

		const newUser = await this.userRepository.create({
			email: email,
			authProvider: 'google',
			password: '',
			name: name,
			providerId: googleUserId,
		});

		return {
			message: 'User created and logged in successfully',
			user: newUser,
		};
	}

	@Get('logout')
	emailLogout() {}
}
