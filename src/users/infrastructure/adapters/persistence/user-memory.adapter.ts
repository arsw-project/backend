import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UpdateUserDto } from '@users/application/dto/update-user.dto';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

@Injectable()
export class UserMemoryAdapter extends UserRepository {
	private readonly users: User[] = [];

	create(user: CreateUserDto): Promise<User> {
		const now = new Date();
		const newUser: User = {
			...user,
			id: (this.users.length + 1).toString(),
			createdAt: now,
			updatedAt: now,
			role: user.role || 'user',
		};

		this.users.push(newUser);
		return Promise.resolve(newUser);
	}

	findById(id: string): Promise<User | null> {
		const user = this.users.find((user) => user.id === id);
		return Promise.resolve(user || null);
	}

	findByEmail(email: string): Promise<User | null> {
		const user = this.users.find((user) => user.email === email);
		return Promise.resolve(user || null);
	}

	findByProviderId(
		authProvider: string,
		providerId: string,
	): Promise<User | null> {
		const user = this.users.find(
			(user) =>
				user.authProvider === authProvider && user.providerId === providerId,
		);
		return Promise.resolve(user || null);
	}

	checkUserConflict(userDto: CreateUserDto): Promise<boolean> {
		const conflictUser = this.users.find(
			(user) =>
				user.email === userDto.email ||
				(user.authProvider === userDto.authProvider &&
					user.providerId === userDto.providerId),
		);

		return Promise.resolve(!!conflictUser);
	}

	findAll(): Promise<User[]> {
		return Promise.resolve(this.users);
	}

	update(id: string, data: UpdateUserDto): Promise<User | null> {
		const index = this.users.findIndex((user) => user.id === id);
		if (index === -1) {
			return Promise.resolve(null);
		}

		const existingUser = this.users[index];
		const updatedUser: User = {
			...existingUser,
			...data,
			updatedAt: new Date(),
		};

		this.users[index] = updatedUser;
		return Promise.resolve(updatedUser);
	}

	delete(id: string): Promise<void> {
		const index = this.users.findIndex((user) => user.id === id);
		if (index !== -1) {
			this.users.splice(index, 1);
		}
		return Promise.resolve();
	}
}
