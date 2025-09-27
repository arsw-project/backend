import { Module } from '@nestjs/common';
import { CreateOrganizationUseCase } from '@organizations/application/use-cases/create-organization.case';
import { GetAllOrganizationsUseCase } from '@organizations/application/use-cases/get-all-organizations.case';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { OrganizationDrizzleAdapter } from '@organizations/infrastructure/adapters/persistence/organization-drizzle.adapter';
import { OrganizationRestController } from '@organizations/infrastructure/http/organization-rest.controller';

const OrganizationRepositoryProvider = {
	provide: OrganizationRepository,
	useClass: OrganizationDrizzleAdapter,
};

@Module({
	providers: [
		OrganizationRepositoryProvider,
		{
			provide: GetAllOrganizationsUseCase,
			useFactory: (organizationRepository: OrganizationRepository) => {
				return new GetAllOrganizationsUseCase(organizationRepository);
			},
			inject: [OrganizationRepository],
		},
		{
			provide: CreateOrganizationUseCase,
			useFactory: (organizationRepository: OrganizationRepository) => {
				return new CreateOrganizationUseCase(organizationRepository);
			},
			inject: [OrganizationRepository],
		},
	],
	controllers: [OrganizationRestController],
	exports: [OrganizationRepositoryProvider],
})
export class OrganizationsModule {}
