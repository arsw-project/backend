import { Injectable } from '@nestjs/common';
import { Google, generateCodeVerifier, generateState } from 'arctic';

interface GoogleAuthData {
	state: string;
	codeVerifier: string;
	url: URL;
}

@Injectable()
export class ArcticService {
	public readonly googleClient: Google;

	constructor() {
		if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
			throw new Error(
				'Google client ID and secret must be set in environment variables',
			);
		}

		this.googleClient = new Google(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET,
			`http://${process.env.HOST}/auth/google/login/callback`,
		);
	}

	public createGoogleAuthURL(): GoogleAuthData {
		const state = generateState();
		const codeVerifier = generateCodeVerifier();
		const url = this.googleClient.createAuthorizationURL(state, codeVerifier, [
			'openid',
			'email',
			'profile',
		]);

		return { state, codeVerifier, url };
	}
}
