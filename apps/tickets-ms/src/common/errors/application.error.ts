import type { z } from 'zod';

export type ErrorIssue = z.ZodIssue;

export class ApplicationError extends Error {
	public readonly code: string = 'APPLICATION_ERROR';

	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
	}

	public static isApplicationError(error: unknown): error is ApplicationError {
		return error instanceof ApplicationError;
	}
}

export abstract class ValidationError extends ApplicationError {
	public readonly issues: ErrorIssue[];
	public abstract readonly code: string;

	constructor(message: string, issues: ErrorIssue[] = []) {
		super(message);
		this.issues = issues;
	}
}
