import { CreateUserDto } from '@users/application/dto/create-user.dto';
import { UpdateUserDto } from '@users/application/dto/update-user.dto';
import { AuthProvider, User } from '@users/domain/entities/user.entity';

export abstract class UserRepository {
	abstract create(createUserDto: CreateUserDto): Promise<User>;

	abstract findById(id: string): Promise<User | null>;

	abstract findByEmail(email: string): Promise<User | null>;

	abstract findByProviderId(
		authProvider: AuthProvider,
		providerId: string,
	): Promise<User | null>;

	abstract checkUserConflict(userDto: CreateUserDto): Promise<boolean>;

	abstract findAll(): Promise<User[]>;

	abstract findByOrganizationIds(organizationIds: string[]): Promise<User[]>;

	abstract update(
		id: string,
		updateUserDto: UpdateUserDto,
	): Promise<User | null>;

	abstract delete(id: string): Promise<void>;
}
