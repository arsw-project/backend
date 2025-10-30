import argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CryptoService } from '../crypto.service';

// Mock argon2 module
vi.mock('argon2', () => ({
	default: {
		hash: vi.fn(),
		verify: vi.fn(),
	},
}));

describe('CryptoService', () => {
	let cryptoService: CryptoService;

	beforeEach(() => {
		cryptoService = new CryptoService();
		vi.clearAllMocks();
	});

	describe('generateSecureRandomString', () => {
		describe('success cases', () => {
			it('should generate random string with default length of 24', () => {
				const result = cryptoService.generateSecureRandomString();

				expect(result).toBeDefined();
				expect(result.length).toBe(24);
				expect(typeof result).toBe('string');
			});

			it('should generate random string with custom length', () => {
				const customLength = 16;
				const result = cryptoService.generateSecureRandomString(customLength);

				expect(result).toBeDefined();
				expect(result.length).toBe(customLength);
				expect(typeof result).toBe('string');
			});

			it('should generate random string with length 1', () => {
				const result = cryptoService.generateSecureRandomString(1);

				expect(result).toBeDefined();
				expect(result.length).toBe(1);
			});

			it('should generate random string with large length', () => {
				const largeLength = 100;
				const result = cryptoService.generateSecureRandomString(largeLength);

				expect(result).toBeDefined();
				expect(result.length).toBe(largeLength);
			});

			it('should only contain characters from allowed alphabet', () => {
				const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
				const result = cryptoService.generateSecureRandomString(50);

				for (const char of result) {
					expect(alphabet).toContain(char);
				}
			});

			it('should generate different strings on multiple calls', () => {
				const result1 = cryptoService.generateSecureRandomString(24);
				const result2 = cryptoService.generateSecureRandomString(24);
				const result3 = cryptoService.generateSecureRandomString(24);

				// With cryptographic randomness, these should be different
				// While theoretically they could be the same, the probability is extremely low
				expect(result1).not.toBe(result2);
				expect(result2).not.toBe(result3);
				expect(result1).not.toBe(result3);
			});
		});

		describe('edge cases', () => {
			it('should handle length of 0 by returning empty string', () => {
				const result = cryptoService.generateSecureRandomString(0);

				expect(result).toBe('');
			});

			it('should skip indices >= alphabetSize and continue generating', () => {
				// To test the skip branch (line 25), we need to force index >= 34
				// The algorithm extracts 5 bits at a time: index = bits >>> (bitsAvailable - 5)
				// With 5 bits, we can get values 0-31 from a single byte
				// But when we accumulate bits, we might get 32, 33, 34, 35, etc.
				// We need to provide bytes that when bit-shifted produce index >= 34

				const originalGetRandomValues = crypto.getRandomValues.bind(crypto);
				const controlledBytes = [
					255, // 11111111 - will accumulate bits
					255, // 11111111 - more bits
					255, // 11111111 - should produce index >= 34 when extracted
					200, // Random valid bytes after
					150,
					100,
					50,
					25,
					12,
					6,
				];
				let byteIndex = 0;

				const spy = vi
					.spyOn(crypto, 'getRandomValues')
					.mockImplementation((array: Uint8Array) => {
						// Provide controlled bytes to trigger the skip condition
						if (byteIndex < controlledBytes.length) {
							array[0] = controlledBytes[byteIndex];
							byteIndex++;
						} else {
							// Fallback to original implementation
							return originalGetRandomValues(array);
						}
						return array;
					});

				const result = cryptoService.generateSecureRandomString(5);

				expect(result.length).toBe(5);
				expect(spy).toHaveBeenCalled();

				spy.mockRestore();
			});
		});
	});

	describe('hashSecret', () => {
		describe('success cases', () => {
			it('should hash secret string to Uint8Array using SHA-256', async () => {
				const secret = 'my-secret-string';
				const result = await cryptoService.hashSecret(secret);

				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.byteLength).toBe(32); // SHA-256 produces 32 bytes
			});

			it('should produce consistent hash for same secret', async () => {
				const secret = 'test-secret';
				const result1 = await cryptoService.hashSecret(secret);
				const result2 = await cryptoService.hashSecret(secret);

				expect(result1).toEqual(result2);
			});

			it('should produce different hashes for different secrets', async () => {
				const secret1 = 'secret-one';
				const secret2 = 'secret-two';
				const result1 = await cryptoService.hashSecret(secret1);
				const result2 = await cryptoService.hashSecret(secret2);

				expect(result1).not.toEqual(result2);
			});

			it('should handle empty string', async () => {
				const secret = '';
				const result = await cryptoService.hashSecret(secret);

				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.byteLength).toBe(32);
			});

			it('should handle long strings', async () => {
				const secret = 'a'.repeat(1000);
				const result = await cryptoService.hashSecret(secret);

				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.byteLength).toBe(32);
			});

			it('should handle special characters', async () => {
				const secret = '!@#$%^&*()_+-=[]{}|;:,.<>?';
				const result = await cryptoService.hashSecret(secret);

				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.byteLength).toBe(32);
			});
		});
	});

	describe('constantTimeEqual', () => {
		describe('success cases', () => {
			it('should return true for identical Uint8Arrays', () => {
				const a = new Uint8Array([1, 2, 3, 4, 5]);
				const b = new Uint8Array([1, 2, 3, 4, 5]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(true);
			});

			it('should return true for empty arrays', () => {
				const a = new Uint8Array([]);
				const b = new Uint8Array([]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(true);
			});

			it('should return true for single element arrays with same value', () => {
				const a = new Uint8Array([42]);
				const b = new Uint8Array([42]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(true);
			});

			it('should return true for arrays with all zeros', () => {
				const a = new Uint8Array([0, 0, 0, 0]);
				const b = new Uint8Array([0, 0, 0, 0]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(true);
			});
		});

		describe('error cases', () => {
			it('should return false for arrays with different lengths', () => {
				const a = new Uint8Array([1, 2, 3]);
				const b = new Uint8Array([1, 2, 3, 4]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should return false for arrays with different values', () => {
				const a = new Uint8Array([1, 2, 3, 4, 5]);
				const b = new Uint8Array([1, 2, 3, 4, 6]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should return false for completely different arrays of same length', () => {
				const a = new Uint8Array([1, 2, 3, 4, 5]);
				const b = new Uint8Array([6, 7, 8, 9, 10]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should return false when first element differs', () => {
				const a = new Uint8Array([1, 2, 3]);
				const b = new Uint8Array([0, 2, 3]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should return false when middle element differs', () => {
				const a = new Uint8Array([1, 2, 3]);
				const b = new Uint8Array([1, 0, 3]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should return false when last element differs', () => {
				const a = new Uint8Array([1, 2, 3]);
				const b = new Uint8Array([1, 2, 0]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});
		});

		describe('edge cases', () => {
			it('should return false when first array is empty and second is not', () => {
				const a = new Uint8Array([]);
				const b = new Uint8Array([1]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should return false when second array is empty and first is not', () => {
				const a = new Uint8Array([1]);
				const b = new Uint8Array([]);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});

			it('should handle large arrays correctly', () => {
				const a = new Uint8Array(1000).fill(1);
				const b = new Uint8Array(1000).fill(1);

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(true);
			});

			it('should detect difference in large arrays', () => {
				const a = new Uint8Array(1000).fill(1);
				const b = new Uint8Array(1000).fill(1);
				b[500] = 2; // Change one element in the middle

				const result = cryptoService.constantTimeEqual(a, b);

				expect(result).toBe(false);
			});
		});
	});

	describe('hashPassword', () => {
		describe('success cases', () => {
			it('should hash password using argon2', async () => {
				const password = 'mySecurePassword123';
				const expectedHash = '$argon2id$v=19$m=65536,t=3,p=4$...';
				vi.mocked(argon2.hash).mockResolvedValue(expectedHash);

				const result = await cryptoService.hashPassword(password);

				expect(result).toBe(expectedHash);
				expect(argon2.hash).toHaveBeenCalledWith(password);
				expect(argon2.hash).toHaveBeenCalledTimes(1);
			});

			it('should handle different passwords', async () => {
				const password1 = 'password1';
				const password2 = 'password2';
				const hash1 = '$argon2id$hash1';
				const hash2 = '$argon2id$hash2';

				vi.mocked(argon2.hash)
					.mockResolvedValueOnce(hash1)
					.mockResolvedValueOnce(hash2);

				const result1 = await cryptoService.hashPassword(password1);
				const result2 = await cryptoService.hashPassword(password2);

				expect(result1).toBe(hash1);
				expect(result2).toBe(hash2);
				expect(result1).not.toBe(result2);
			});

			it('should handle empty password', async () => {
				const password = '';
				const expectedHash = '$argon2id$empty';
				vi.mocked(argon2.hash).mockResolvedValue(expectedHash);

				const result = await cryptoService.hashPassword(password);

				expect(result).toBe(expectedHash);
				expect(argon2.hash).toHaveBeenCalledWith(password);
			});

			it('should handle long passwords', async () => {
				const password = 'a'.repeat(1000);
				const expectedHash = '$argon2id$long';
				vi.mocked(argon2.hash).mockResolvedValue(expectedHash);

				const result = await cryptoService.hashPassword(password);

				expect(result).toBe(expectedHash);
				expect(argon2.hash).toHaveBeenCalledWith(password);
			});

			it('should handle special characters in password', async () => {
				const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
				const expectedHash = '$argon2id$special';
				vi.mocked(argon2.hash).mockResolvedValue(expectedHash);

				const result = await cryptoService.hashPassword(password);

				expect(result).toBe(expectedHash);
				expect(argon2.hash).toHaveBeenCalledWith(password);
			});
		});
	});

	describe('verifyPassword', () => {
		describe('success cases', () => {
			it('should return true when password matches hash', async () => {
				const hashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$...';
				const password = 'mySecurePassword123';
				vi.mocked(argon2.verify).mockResolvedValue(true);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(true);
				expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
				expect(argon2.verify).toHaveBeenCalledTimes(1);
			});

			it('should return false when password does not match hash', async () => {
				const hashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$...';
				const password = 'wrongPassword';
				vi.mocked(argon2.verify).mockResolvedValue(false);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(false);
				expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
				expect(argon2.verify).toHaveBeenCalledTimes(1);
			});

			it('should handle empty password verification', async () => {
				const hashedPassword = '$argon2id$empty';
				const password = '';
				vi.mocked(argon2.verify).mockResolvedValue(true);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(true);
				expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
			});
		});

		describe('error cases', () => {
			it('should return false when argon2.verify throws an error', async () => {
				const hashedPassword = 'invalid-hash';
				const password = 'password123';
				const error = new Error('Invalid hash format');
				vi.mocked(argon2.verify).mockRejectedValue(error);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(false);
				expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
				expect(argon2.verify).toHaveBeenCalledTimes(1);
			});

			it('should return false when verification fails with any exception', async () => {
				const hashedPassword = 'corrupted-hash';
				const password = 'password123';
				vi.mocked(argon2.verify).mockRejectedValue(
					new Error('Unexpected error'),
				);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(false);
			});

			it('should handle non-Error exceptions gracefully', async () => {
				const hashedPassword = 'malformed-hash';
				const password = 'password123';
				// eslint-disable-next-line prefer-promise-reject-errors
				vi.mocked(argon2.verify).mockRejectedValue('string error');

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(false);
			});
		});

		describe('edge cases', () => {
			it('should handle very long passwords', async () => {
				const hashedPassword = '$argon2id$long';
				const password = 'a'.repeat(1000);
				vi.mocked(argon2.verify).mockResolvedValue(true);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(true);
				expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
			});

			it('should handle special characters in password verification', async () => {
				const hashedPassword = '$argon2id$special';
				const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
				vi.mocked(argon2.verify).mockResolvedValue(true);

				const result = await cryptoService.verifyPassword(
					hashedPassword,
					password,
				);

				expect(result).toBe(true);
				expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password);
			});
		});
	});
});
