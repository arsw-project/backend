import { Module } from '@nestjs/common';
import { CreateOrganizationUseCase } from '@organizations/application/use-cases/create-organization.case';
import { DeleteOrganizationUseCase } from '@organizations/application/use-cases/delete-organization.case';
import { GetAllOrganizationsUseCase } from '@organizations/application/use-cases/get-all-organizations.case';
import { GetOrganizationByIdUseCase } from '@organizations/application/use-cases/get-organization-by-id.case';
import { GetOrganizationByNameUseCase } from '@organizations/application/use-cases/get-organization-by-name.case';
import { UpdateOrganizationUseCase } from '@organizations/application/use-cases/update-organization.case';
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
		{
			provide: GetOrganizationByIdUseCase,
			useFactory: (organizationRepository: OrganizationRepository) => {
				return new GetOrganizationByIdUseCase(organizationRepository);
			},
			inject: [OrganizationRepository],
		},
		{
			provide: GetOrganizationByNameUseCase,
			useFactory: (organizationRepository: OrganizationRepository) => {
				return new GetOrganizationByNameUseCase(organizationRepository);
			},
			inject: [OrganizationRepository],
		},
		{
			provide: UpdateOrganizationUseCase,
			useFactory: (organizationRepository: OrganizationRepository) => {
				return new UpdateOrganizationUseCase(organizationRepository);
			},
			inject: [OrganizationRepository],
		},
		{
			provide: DeleteOrganizationUseCase,
			useFactory: (organizationRepository: OrganizationRepository) => {
				return new DeleteOrganizationUseCase(organizationRepository);
			},
			inject: [OrganizationRepository],
		},
	],
	controllers: [OrganizationRestController],
	exports: [OrganizationRepositoryProvider],
})
export class OrganizationsModule {}
