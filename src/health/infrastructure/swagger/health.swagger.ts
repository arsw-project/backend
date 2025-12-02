import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponseDto {
	@ApiProperty({
		example: '/GET ok',
		description: 'Estado del endpoint',
	})
	status: string;
}
