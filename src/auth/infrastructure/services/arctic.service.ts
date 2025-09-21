import { Injectable } from '@nestjs/common';
import { Google } from 'arctic';

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
			'http://localhost:3000/auth/google/login/callback',
		);
	}
}
