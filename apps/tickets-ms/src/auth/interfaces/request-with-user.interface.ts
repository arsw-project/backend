import { Request } from 'express';

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface RequestWithUser extends Request {
	user: SessionUser | null;
}
