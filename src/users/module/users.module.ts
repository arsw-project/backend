import { Module } from '@nestjs/common';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { UserDrizzleAdapter } from '@users/infrastructure/adapters/persistence/user-drizzle.adapter';
import { UserRestController } from '@users/infrastructure/http/user-rest.controller';

const UserRepositoryProvider = {
	provide: UserRepository,
	useClass: UserDrizzleAdapter,
};

@Module({
	providers: [UserRepositoryProvider],
	controllers: [UserRestController],
	exports: [UserRepositoryProvider],
})
export class UsersModule {}
