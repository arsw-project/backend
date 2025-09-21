import { CryptoService } from '@auth/application/services/crypto.service';
import { LoginGoogleUserUseCase } from '@auth/application/use-cases/login-google-user.case';
import { SessionRepository } from '@auth/domain/ports/persistence/session-repository.port';
import { SessionMemoryAdapter } from '@auth/infrastructure/adapters/persistence/session-memory.adapter';
import { ArcticService } from '@auth/infrastructure/clients/arctic.client';
import { GoogleRestController } from '@auth/infrastructure/http/google-rest.controller';
import { Module } from '@nestjs/common';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { UsersModule } from '@users/module/users.module';

@Module({
	imports: [UsersModule],
	providers: [
		ArcticService,
		CryptoService,
		{
			provide: SessionRepository,
			useClass: SessionMemoryAdapter,
		},
		{
			provide: LoginGoogleUserUseCase,
			useFactory: (
				cryptoService: CryptoService,
				sessionRepository: SessionRepository,
				userRepository: UserRepository,
			) => {
				return new LoginGoogleUserUseCase(
					cryptoService,
					sessionRepository,
					userRepository,
				);
			},
			inject: [CryptoService, SessionRepository, UserRepository],
		},
	],
	controllers: [GoogleRestController],
})
export class AuthModule {}
