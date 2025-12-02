import { SessionUserDto } from '@users/application/dto/session-user.dto';

export interface Session {
	id: string;
	secretHash: Uint8Array;
	createdAt: Date;
	user: SessionUserDto;
}

export interface SessionWithToken extends Session {
	token: string;
}
