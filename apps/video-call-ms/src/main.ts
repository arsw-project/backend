import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS for WebSocket connections
	app.enableCors({
		origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
		credentials: true,
		methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'DNT',
			'User-Agent',
			'X-Requested-With',
			'If-Modified-Since',
			'Cache-Control',
			'Content-Type',
			'Range',
			'Authorization',
			'Cookie',
		],
		exposedHeaders: ['Set-Cookie'],
		maxAge: 1728000,
	});

	// Swagger Configuration
	const config = new DocumentBuilder()
		.setTitle('Nexus Video Call API')
		.setDescription(
			'API de Microservicio de Video Llamadas para Nexus - Gestión de salas de video llamada, chat en tiempo real y conexiones WebSocket',
		)
		.setVersion('1.0')
		.addTag('Chat', 'Historial de mensajes de chat')
		.addTag('Health', 'Estado del servicio')
		.addCookieAuth('session-token', {
			type: 'apiKey',
			in: 'cookie',
			name: 'session-token',
			description: 'Token de sesión almacenado en cookie HTTP-only',
		})
		.build();

	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	const port = process.env.PORT || 3002;
	await app.listen(port);
	console.log(`Video Call microservice is listening on port ${port}`);
	console.log(
		`Swagger documentation available at http://localhost:${port}/api`,
	);
	console.log(`WebSocket server ready for connections`);
}
bootstrap();
