import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { AuthProvider, User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { usersTable } from '@users/infrastructure/entities/drizzle-user.schema';
import { and, eq, or } from 'drizzle-orm';

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

		return createdUser;
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

		return users[0];
	}

	async findByEmail(email: string): Promise<User | null> {
		const users = await this.drizzleConnection.database
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1);

		if (users.length === 0) {
			return null;
		}

		return users[0];
	}

	async findByProviderId(
		authProvider: AuthProvider,
		providerId: string,
	): Promise<User | null> {
		const users = await this.drizzleConnection.database
			.select()
			.from(usersTable)
			.where(
				and(
					eq(usersTable.authProvider, authProvider),
					eq(usersTable.providerId, providerId),
				),
			)
			.limit(1);

		if (users.length === 0) {
			return null;
		}

		return users[0];
	}

	async checkUserConflict(userDto: CreateUserDto): Promise<boolean> {
		const users = await this.drizzleConnection.database
			.select()
			.from(usersTable)
			.where(
				or(
					eq(usersTable.email, userDto.email),
					and(
						eq(usersTable.authProvider, userDto.authProvider),
						eq(usersTable.providerId, userDto.providerId ?? ''),
					),
				),
			);

		return users.length > 0;
	}

	async findAll(): Promise<User[]> {
		const users = await this.drizzleConnection.database
			.select()
			.from(usersTable);

		return users;
	}
}
