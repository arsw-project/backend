import { ApiProperty } from '@nestjs/swagger';

export class GoogleOAuthRedirectDto {
	@ApiProperty({
		description: 'URL de redirección a Google OAuth',
		example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
	})
	url: string;

	@ApiProperty({
		description: 'Código de estado HTTP para redirección',
		example: 302,
	})
	statusCode: number;
}

export class GoogleOAuthErrorDto {
	@ApiProperty({
		description: 'Mensaje de error',
		example: 'Missing required parameters or cookies',
	})
	message: string;

	@ApiProperty({
		description: 'Código de error',
		example: 'BAD_REQUEST',
	})
	error: string;

	@ApiProperty({
		description: 'Código de estado HTTP',
		example: 400,
	})
	statusCode: number;
}
