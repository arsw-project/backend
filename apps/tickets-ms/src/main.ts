import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
	const port = parseInt(process.env.TICKETS_MS_PORT || '3001', 10);
	const app = await NestFactory.create(AppModule);

	app.use(cookieParser());
	app.enableCors({
		origin: true,
		credentials: true,
	});

	// Swagger Configuration
	const config = new DocumentBuilder()
		.setTitle('Nexus Tickets API')
		.setDescription(
			'API de Microservicio de Tickets para Nexus - Gestión de tickets, tareas y seguimiento de trabajo',
		)
		.setVersion('1.0')
		.addTag('Tickets', 'Gestión de tickets y tareas')
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

	await app.listen(port);
	console.log(`Tickets microservice is listening on port ${port}`);
	console.log(
		`Swagger documentation available at http://localhost:${port}/api`,
	);
}
bootstrap();
