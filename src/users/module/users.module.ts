import { CryptoService } from '@auth/application/services/crypto.service';
import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '@users/application/use-cases/create-user.case';
import { GetAllUsersUseCase } from '@users/application/use-cases/get-all-users.case';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { UserDrizzleAdapter } from '@users/infrastructure/adapters/persistence/user-drizzle.adapter';
import { UserRestController } from '@users/infrastructure/http/user-rest.controller';

const UserRepositoryProvider = {
	provide: UserRepository,
	useClass: UserDrizzleAdapter,
};

@Module({
	providers: [
		UserRepositoryProvider,
		CryptoService,
		{
			provide: GetAllUsersUseCase,
			useFactory: (userRepository: UserRepository) => {
				return new GetAllUsersUseCase(userRepository);
			},
			inject: [UserRepository],
		},
		{
			provide: CreateUserUseCase,
			useFactory: (
				userRepository: UserRepository,
				cryptoService: CryptoService,
			) => {
				return new CreateUserUseCase(userRepository, cryptoService);
			},
			inject: [UserRepository, CryptoService],
		},
	],
	controllers: [UserRestController],
	exports: [UserRepositoryProvider],
})
export class UsersModule {}
