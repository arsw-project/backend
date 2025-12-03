import { AuthGuard } from '@auth/guards/auth.guard';
import { SessionMiddleware } from '@auth/middleware/session.middleware';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

@Module({
	imports: [HttpModule],
	providers: [AuthGuard],
	exports: [AuthGuard],
})
export class AuthModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(SessionMiddleware).forRoutes('*');
	}
}
