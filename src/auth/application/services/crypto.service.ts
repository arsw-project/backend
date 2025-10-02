import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoService {
	public generateSecureRandomString(length: number = 24): string {
		const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
		const alphabetSize = alphabet.length; // 34

		let result = '';
		let bits = 0;
		let bitsAvailable = 0;

		while (result.length < length) {
			if (bitsAvailable < 5) {
				const byte = crypto.getRandomValues(new Uint8Array(1))[0];
				bits = (bits << 8) | byte;
				bitsAvailable += 8;
			}

			const index = bits >>> (bitsAvailable - 5);
			bitsAvailable -= 5;
			bits &= (1 << bitsAvailable) - 1;

			if (index < alphabetSize) {
				result += alphabet[index];
			}
		}

		return result;
	}

	public async hashSecret(secret: string): Promise<Uint8Array> {
		const secretBytes = new TextEncoder().encode(secret);
		const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes);
		return new Uint8Array(secretHashBuffer);
	}

	public constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
		if (a.byteLength !== b.byteLength) {
			return false;
		}
		let c = 0;

		for (let i = 0; i < a.byteLength; i++) {
			c |= a[i] ^ b[i];
		}

		return c === 0;
	}
}
