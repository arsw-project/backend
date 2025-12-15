import { ok, SuccessResult } from '@common/utility/results';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

export interface GetAllUsersFilters {
	organizationIds?: string[];
}

export class GetAllUsersUseCase {
	constructor(private readonly userRepository: UserRepository) {}

	async execute(filters?: GetAllUsersFilters): Promise<SuccessResult<User[]>> {
		if (filters?.organizationIds && filters.organizationIds.length > 0) {
			return ok(
				await this.userRepository.findByOrganizationIds(
					filters.organizationIds,
				),
			);
		}

		return ok(await this.userRepository.findAll());
	}
}
