import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { organizationsTable } from '@organizations/infrastructure/entities/organization.drizzle-schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class OrganizationDrizzleAdapter implements OrganizationRepository {
	constructor(private readonly drizzleConnection: DrizzleConnection) {}

	async create(
		createOrganizationDto: CreateOrganizationDto,
	): Promise<Organization> {
		const [createdOrganization] = await this.drizzleConnection.database
			.insert(organizationsTable)
			.values({
				...createOrganizationDto,
			})
			.returning();

		return createdOrganization as unknown as Organization;
	}

	async findById(id: string): Promise<Organization | null> {
		const organizations = await this.drizzleConnection.database
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable.id, id))
			.limit(1);

		if (organizations.length === 0) {
			return null;
		}

		return organizations[0] as unknown as Organization;
	}

	async findByName(name: string): Promise<Organization | null> {
		const organizations = await this.drizzleConnection.database
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable.name, name))
			.limit(1);

		if (organizations.length === 0) {
			return null;
		}

		return organizations[0] as unknown as Organization;
	}

	async checkOrganizationConflict(
		organizationDto: CreateOrganizationDto,
	): Promise<boolean> {
		const organizations = await this.drizzleConnection.database
			.select()
			.from(organizationsTable)
			.where(eq(organizationsTable.name, organizationDto.name));

		return organizations.length > 0;
	}

	async findAll(): Promise<Organization[]> {
		const organizations = await this.drizzleConnection.database
			.select()
			.from(organizationsTable);

		return organizations as unknown as Organization[];
	}
}
