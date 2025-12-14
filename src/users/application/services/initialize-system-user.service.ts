import { CryptoService } from '@auth/application/services/crypto.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

const SYSTEM_USER_EMAIL = 'root@mail.com';
const SYSTEM_USER_PASSWORD = 'root';
const SYSTEM_USER_NAME = 'System';

@Injectable()
export class InitializeSystemUserService implements OnModuleInit {
	private readonly logger = new Logger(InitializeSystemUserService.name);

	constructor(
		private readonly userRepository: UserRepository,
		private readonly cryptoService: CryptoService,
	) {}

	async onModuleInit(): Promise<void> {
		try {
			await this.ensureSystemUserExists();
		} catch (error) {
			this.logger.error(
				`Failed to initialize system user: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	}

	private async ensureSystemUserExists(): Promise<void> {
		const existingUser =
			await this.userRepository.findByEmail(SYSTEM_USER_EMAIL);

		if (existingUser) {
			this.logger.debug(
				`System user already exists with email: ${SYSTEM_USER_EMAIL}`,
			);
			return;
		}

		await this.createSystemUser();
	}

	private async createSystemUser(): Promise<User> {
		const passwordHash =
			await this.cryptoService.hashPassword(SYSTEM_USER_PASSWORD);

		const user = await this.userRepository.create({
			name: SYSTEM_USER_NAME,
			email: SYSTEM_USER_EMAIL,
			password: passwordHash,
			authProvider: 'local',
			providerId: null,
			role: 'system',
		});

		this.logger.log(
			`System user created successfully with email: ${SYSTEM_USER_EMAIL}`,
		);

		return user;
	}
}
