import { CryptoService } from '@auth/application/services/crypto.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { InitializeSystemUserService } from '@users/application/services/initialize-system-user.service';
import { CreateUserUseCase } from '@users/application/use-cases/create-user.case';
import { DeleteUserUseCase } from '@users/application/use-cases/delete-user.case';
import { GetAllUsersUseCase } from '@users/application/use-cases/get-all-users.case';
import { GetUserByEmailUseCase } from '@users/application/use-cases/get-user-by-email.case';
import { GetUserByIdUseCase } from '@users/application/use-cases/get-user-by-id.case';
import { UpdateUserUseCase } from '@users/application/use-cases/update-user.case';
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
		InitializeSystemUserService,
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
		{
			provide: GetUserByIdUseCase,
			useFactory: (userRepository: UserRepository) => {
				return new GetUserByIdUseCase(userRepository);
			},
			inject: [UserRepository],
		},
		{
			provide: GetUserByEmailUseCase,
			useFactory: (userRepository: UserRepository) => {
				return new GetUserByEmailUseCase(userRepository);
			},
			inject: [UserRepository],
		},
		{
			provide: UpdateUserUseCase,
			useFactory: (
				userRepository: UserRepository,
				cryptoService: CryptoService,
			) => {
				return new UpdateUserUseCase(userRepository, cryptoService);
			},
			inject: [UserRepository, CryptoService],
		},
		{
			provide: DeleteUserUseCase,
			useFactory: (userRepository: UserRepository) => {
				return new DeleteUserUseCase(userRepository);
			},
			inject: [UserRepository],
		},
	],
	controllers: [UserRestController],
	exports: [UserRepositoryProvider],
})
export class UsersModule implements OnModuleInit {
	constructor(
		private readonly initializeSystemUserService: InitializeSystemUserService,
	) {}

	onModuleInit(): void {
		this.initializeSystemUserService.onModuleInit();
	}
}
