import { Module } from '@nestjs/common';
import { UserRepository } from '@users/domain/ports/user-repository.port';
import { UserMemoryAdapter } from '@users/infrastructure/adapters/user-memory.adapter';
import { UserRestController } from '@users/infrastructure/http/user-rest.controller';

@Module({
	providers: [
		{
			useClass: UserMemoryAdapter,
			provide: UserRepository,
		},
	],
	controllers: [UserRestController],
})
export class UsersModule {}
