import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/user-repository.port';

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
		};

		this.users.push(newUser);
		return Promise.resolve(newUser);
	}

	findById(id: string): Promise<User | null> {
		const user = this.users.find((user) => user.id === id);
		return Promise.resolve(user || null);
	}

	findAll(): Promise<User[]> {
		return Promise.resolve(this.users);
	}
}
