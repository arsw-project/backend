import { Controller, Delete, Get, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponseDto } from '../swagger/health.swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
	@Get()
	@ApiOperation({
		summary: 'Verificar estado del servidor (GET)',
		description:
			'Endpoint para verificar que el servidor está funcionando correctamente',
	})
	@ApiResponse({
		status: 200,
		description: 'Servidor funcionando correctamente',
		type: HealthCheckResponseDto,
	})
	check() {
		return { status: '/GET ok' };
	}

	@Post()
	@ApiOperation({
		summary: 'Verificar estado del servidor (POST)',
		description: 'Endpoint de prueba para método POST',
	})
	@ApiResponse({
		status: 201,
		description: 'Solicitud POST procesada correctamente',
		type: HealthCheckResponseDto,
	})
	create() {
		return { status: '/POST ok' };
	}

	@Put()
	@ApiOperation({
		summary: 'Verificar estado del servidor (PUT)',
		description: 'Endpoint de prueba para método PUT',
	})
	@ApiResponse({
		status: 200,
		description: 'Solicitud PUT procesada correctamente',
		type: HealthCheckResponseDto,
	})
	update() {
		return { status: '/PUT ok' };
	}

	@Patch()
	@ApiOperation({
		summary: 'Verificar estado del servidor (PATCH)',
		description: 'Endpoint de prueba para método PATCH',
	})
	@ApiResponse({
		status: 200,
		description: 'Solicitud PATCH procesada correctamente',
		type: HealthCheckResponseDto,
	})
	partialUpdate() {
		return { status: '/PATCH ok' };
	}

	@Delete()
	@ApiOperation({
		summary: 'Verificar estado del servidor (DELETE)',
		description: 'Endpoint de prueba para método DELETE',
	})
	@ApiResponse({
		status: 200,
		description: 'Solicitud DELETE procesada correctamente',
		type: HealthCheckResponseDto,
	})
	delete() {
		return { status: '/DELETE ok' };
	}
}
