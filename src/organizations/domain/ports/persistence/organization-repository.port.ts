import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { Organization } from '@organizations/domain/entities/organization.entity';

export abstract class OrganizationRepository {
	abstract create(
		createOrganizationDto: CreateOrganizationDto,
	): Promise<Organization>;

	abstract findById(id: string): Promise<Organization | null>;

	abstract findByName(name: string): Promise<Organization | null>;

	abstract checkOrganizationConflict(
		organizationDto: CreateOrganizationDto,
	): Promise<boolean>;

	abstract findAll(): Promise<Organization[]>;
}
