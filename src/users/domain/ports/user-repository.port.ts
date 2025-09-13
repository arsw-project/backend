import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { User } from '@users/domain/entities/user.entity';

export abstract class UserRepository {
	abstract create(user: CreateUserDto): Promise<User>;

	abstract findById(id: string): Promise<User | null>;

	abstract findAll(): Promise<User[]>;
}
