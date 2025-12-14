import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';
import { membershipsTable } from '@organizations/infrastructure/entities/membership.drizzle-schema';
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

	async update(
		id: string,
		update: Partial<CreateOrganizationDto>,
	): Promise<Organization | null> {
		const now = new Date();
		const [updated] = await this.drizzleConnection.database
			.update(organizationsTable)
			.set({
				...update,
				updatedAt: now as unknown as Date,
			})
			.where(eq(organizationsTable.id, id))
			.returning();

		if (!updated) return null;
		return updated as unknown as Organization;
	}

	async delete(id: string): Promise<void> {
		await this.drizzleConnection.database
			.delete(organizationsTable)
			.where(eq(organizationsTable.id, id));
	}

	async findByUserId(userId: string): Promise<Organization[]> {
		const organizations = await this.drizzleConnection.database
			.select({
				id: organizationsTable.id,
				name: organizationsTable.name,
				description: organizationsTable.description,
				createdAt: organizationsTable.createdAt,
				updatedAt: organizationsTable.updatedAt,
			})
			.from(organizationsTable)
			.innerJoin(
				membershipsTable,
				eq(membershipsTable.organizationId, organizationsTable.id),
			)
			.where(eq(membershipsTable.userId, userId));

		return organizations as unknown as Organization[];
	}
}
