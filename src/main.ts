import { LoggerPort } from '@logging/domain/ports/services/logger.port';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/module/app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.useLogger(app.get(LoggerPort));

	// Swagger Configuration
	const config = new DocumentBuilder()
		.setTitle('Nexus API')
		.setDescription(
			'API Backend para Nexus - Plataforma de gestión de proyectos de software con colaboración en tiempo real e integración de IA',
		)
		.setVersion('1.0')
		.addTag('Health', 'Endpoints de verificación de estado del servidor')
		.addTag('Auth', 'Autenticación y gestión de sesiones')
		.addTag('Users', 'Gestión de usuarios')
		.addTag('Organizations', 'Gestión de organizaciones')
		.addTag('Memberships', 'Gestión de membresías de organizaciones')
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

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
