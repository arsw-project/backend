import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { User } from '@users/domain/entities/user.entity';

export abstract class UserRepository {
	abstract create(createUserDto: CreateUserDto): Promise<User>;

	abstract findById(id: string): Promise<User | null>;

	abstract findByEmail(email: string): Promise<User | null>;

	abstract findByProviderId(
		authProvider: string,
		providerId: string,
	): Promise<User | null>;

	abstract checkUserConflict(userDto: CreateUserDto): Promise<boolean>;

	abstract findAll(): Promise<User[]>;
}
