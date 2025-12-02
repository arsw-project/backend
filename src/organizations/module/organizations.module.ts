import { Module } from '@nestjs/common';
import { AddMemberUseCase } from '@organizations/application/use-cases/add-member.case';
import { CreateOrganizationUseCase } from '@organizations/application/use-cases/create-organization.case';
import { DeleteOrganizationUseCase } from '@organizations/application/use-cases/delete-organization.case';
import { GetAllOrganizationsUseCase } from '@organizations/application/use-cases/get-all-organizations.case';
import { GetOrganizationByIdUseCase } from '@organizations/application/use-cases/get-organization-by-id.case';
import { GetOrganizationByNameUseCase } from '@organizations/application/use-cases/get-organization-by-name.case';
import { GetOrganizationMembersUseCase } from '@organizations/application/use-cases/get-organization-members.case';
import { GetUserMembershipsUseCase } from '@organizations/application/use-cases/get-user-memberships.case';
import { RemoveMemberUseCase } from '@organizations/application/use-cases/remove-member.case';
import { UpdateMemberRoleUseCase } from '@organizations/application/use-cases/update-member-role.case';
import { UpdateOrganizationUseCase } from '@organizations/application/use-cases/update-organization.case';
import { MembershipRepository } from '@organizations/domain/ports/persistence/membership-repository.port';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { MembershipDrizzleAdapter } from '@organizations/infrastructure/adapters/persistence/membership-drizzle.adapter';
import { OrganizationDrizzleAdapter } from '@organizations/infrastructure/adapters/persistence/organization-drizzle.adapter';
import { MembershipRestController } from '@organizations/infrastructure/http/membership-rest.controller';
import { OrganizationRestController } from '@organizations/infrastructure/http/organization-rest.controller';
import { UserRepository } from '@users/domain/ports/persistence/user-repository.port';
import { UsersModule } from '@users/module/users.module';

const OrganizationRepositoryProvider = {
	provide: OrganizationRepository,
	useClass: OrganizationDrizzleAdapter,
};

const MembershipRepositoryProvider = {
	provide: MembershipRepository,
	useClass: MembershipDrizzleAdapter,
};

@Module({
	imports: [UsersModule],
	providers: [
		OrganizationRepositoryProvider,
		MembershipRepositoryProvider,
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
		// Membership Use Cases
		{
			provide: AddMemberUseCase,
			useFactory: (
				membershipRepository: MembershipRepository,
				organizationRepository: OrganizationRepository,
				userRepository: UserRepository,
			) => {
				return new AddMemberUseCase(
					membershipRepository,
					organizationRepository,
					userRepository,
				);
			},
			inject: [MembershipRepository, OrganizationRepository, UserRepository],
		},
		{
			provide: RemoveMemberUseCase,
			useFactory: (membershipRepository: MembershipRepository) => {
				return new RemoveMemberUseCase(membershipRepository);
			},
			inject: [MembershipRepository],
		},
		{
			provide: UpdateMemberRoleUseCase,
			useFactory: (membershipRepository: MembershipRepository) => {
				return new UpdateMemberRoleUseCase(membershipRepository);
			},
			inject: [MembershipRepository],
		},
		{
			provide: GetOrganizationMembersUseCase,
			useFactory: (
				membershipRepository: MembershipRepository,
				organizationRepository: OrganizationRepository,
			) => {
				return new GetOrganizationMembersUseCase(
					membershipRepository,
					organizationRepository,
				);
			},
			inject: [MembershipRepository, OrganizationRepository],
		},
		{
			provide: GetUserMembershipsUseCase,
			useFactory: (membershipRepository: MembershipRepository) => {
				return new GetUserMembershipsUseCase(membershipRepository);
			},
			inject: [MembershipRepository],
		},
	],
	controllers: [OrganizationRestController, MembershipRestController],
	exports: [OrganizationRepositoryProvider, MembershipRepositoryProvider],
})
export class OrganizationsModule {}
