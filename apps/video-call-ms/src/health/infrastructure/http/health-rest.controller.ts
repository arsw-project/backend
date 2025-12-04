import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

class HealthResponseDto {
	status: string;
	service: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
	@Get()
	@ApiOperation({
		summary: 'Verificar estado del servicio',
		description:
			'Endpoint para verificar que el microservicio de video llamadas está funcionando correctamente.',
	})
	@ApiResponse({
		status: 200,
		description: 'Servicio funcionando correctamente',
		type: HealthResponseDto,
	})
	check() {
		return { status: 'ok', service: 'video-call-ms' };
	}
}
