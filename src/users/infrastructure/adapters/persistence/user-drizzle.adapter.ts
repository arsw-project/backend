import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { usersTable } from '@users/infrastructure/entities/drizzle-user.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserDrizzleAdapter implements UserRepository {
	constructor(private readonly drizzleConnection: DrizzleConnection) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		const [createdUser] = await this.drizzleConnection.database
			.insert(usersTable)
			.values({
				...createUserDto,
			})
			.returning();

		const user: User = {
			...createdUser,
			createdAt: new Date(createdUser.createdAt),
			updatedAt: new Date(createdUser.updatedAt),
		};

		return user;
	}
	async findById(id: string): Promise<User | null> {
		const users = await this.drizzleConnection.database
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, id))
			.limit(1);

		if (users.length === 0) {
			return null;
		}

		const user: User = {
			...users[0],
			createdAt: new Date(users[0].createdAt),
			updatedAt: new Date(users[0].updatedAt),
		};

		return user;
	}
	async findAll(): Promise<User[]> {
		const users = await this.drizzleConnection.database
			.select()
			.from(usersTable);

		return users.map((user) => ({
			...user,
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(user.updatedAt),
		}));
	}
}
