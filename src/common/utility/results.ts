import { ApplicationError } from '@common/errors/application.error';

export interface SuccessResult<T> {
	readonly ok: true;
	value: T;
	error: never;
}

export interface ErrorResult<T> {
	readonly ok: false;
	error: T;
	value: never;
}

export type Result<T, E> = SuccessResult<T> | ErrorResult<E>;

export const isSuccessResult = <T, E>(
	result: Result<T, E>,
): result is SuccessResult<T> => {
	return (result as SuccessResult<T>).value !== undefined;
};

export const isErrorResult = <T, E>(
	result: Result<T, E>,
): result is ErrorResult<E> => {
	return (result as ErrorResult<E>).error !== undefined;
};

export function ok<T>(data: T): SuccessResult<T> {
	return { ok: true, value: data, error: undefined as never };
}

export function error<T extends ApplicationError>(error: T): ErrorResult<T> {
	return { ok: false, error, value: undefined as never };
}
