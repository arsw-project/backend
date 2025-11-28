import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const port = parseInt(process.env.TICKETS_MS_PORT || '3001', 10);
	const app = await NestFactory.create(AppModule);

	app.enableCors();

	await app.listen(port);
	console.log(`Tickets microservice is listening on port ${port}`);
}
bootstrap();
