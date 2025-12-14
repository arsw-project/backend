import { CryptoService } from '@auth/application/services/crypto.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SettingsClient } from '@settings/infrastructure/clients/settings.client';
import { User } from '@users/domain/entities/user.entity';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';

@Injectable()
export class InitializeSystemUserService implements OnModuleInit {
	private readonly logger = new Logger(InitializeSystemUserService.name);

	constructor(
		private readonly userRepository: UserRepository,
		private readonly cryptoService: CryptoService,
		private readonly settingsClient: SettingsClient,
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
		const existingUser = await this.userRepository.findByEmail(
			this.settingsClient.systemUserEmail,
		);

		if (existingUser) {
			this.logger.debug(
				`System user already exists with email: ${this.settingsClient.systemUserEmail}`,
			);
			return;
		}

		await this.createSystemUser();
	}

	private async createSystemUser(): Promise<User> {
		const passwordHash = await this.cryptoService.hashPassword(
			this.settingsClient.systemUserPassword,
		);

		const user = await this.userRepository.create({
			name: this.settingsClient.systemUserName,
			email: this.settingsClient.systemUserEmail,
			password: passwordHash,
			authProvider: 'local',
			providerId: null,
			role: 'system',
		});

		this.logger.log(
			`System user created successfully with email: ${this.settingsClient.systemUserEmail}`,
		);

		return user;
	}
}
