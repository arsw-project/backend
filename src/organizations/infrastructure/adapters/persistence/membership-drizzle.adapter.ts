import { DrizzleConnection } from '@drizzle/infrastructure/drizzle.connection';
import { Injectable } from '@nestjs/common';
import { Membership } from '@organizations/domain/entities/membership.entity';
import {
	CreateMembershipData,
	MembershipRepository,
	UpdateMembershipData,
} from '@organizations/domain/ports/persistence/membership-repository.port';
import { membershipsTable } from '@organizations/infrastructure/entities/membership.drizzle-schema';
import { and, count, eq } from 'drizzle-orm';

@Injectable()
export class MembershipDrizzleAdapter implements MembershipRepository {
	constructor(private readonly drizzleConnection: DrizzleConnection) {}

	async create(data: CreateMembershipData): Promise<Membership> {
		const [createdMembership] = await this.drizzleConnection.database
			.insert(membershipsTable)
			.values({
				userId: data.userId,
				organizationId: data.organizationId,
				role: data.role,
			})
			.returning();

		return createdMembership as Membership;
	}

	async findById(id: string): Promise<Membership | null> {
		const memberships = await this.drizzleConnection.database
			.select()
			.from(membershipsTable)
			.where(eq(membershipsTable.id, id))
			.limit(1);

		if (memberships.length === 0) {
			return null;
		}

		return memberships[0] as Membership;
	}

	async findByUserAndOrganization(
		userId: string,
		organizationId: string,
	): Promise<Membership | null> {
		const memberships = await this.drizzleConnection.database
			.select()
			.from(membershipsTable)
			.where(
				and(
					eq(membershipsTable.userId, userId),
					eq(membershipsTable.organizationId, organizationId),
				),
			)
			.limit(1);

		if (memberships.length === 0) {
			return null;
		}

		return memberships[0] as Membership;
	}

	async findByOrganization(organizationId: string): Promise<Membership[]> {
		const memberships = await this.drizzleConnection.database
			.select()
			.from(membershipsTable)
			.where(eq(membershipsTable.organizationId, organizationId));

		return memberships as Membership[];
	}

	async findByUser(userId: string): Promise<Membership[]> {
		const memberships = await this.drizzleConnection.database
			.select()
			.from(membershipsTable)
			.where(eq(membershipsTable.userId, userId));

		return memberships as Membership[];
	}

	async update(
		id: string,
		data: UpdateMembershipData,
	): Promise<Membership | null> {
		const [updatedMembership] = await this.drizzleConnection.database
			.update(membershipsTable)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(membershipsTable.id, id))
			.returning();

		if (!updatedMembership) {
			return null;
		}

		return updatedMembership as Membership;
	}

	async delete(id: string): Promise<void> {
		await this.drizzleConnection.database
			.delete(membershipsTable)
			.where(eq(membershipsTable.id, id));
	}

	async deleteByOrganization(organizationId: string): Promise<void> {
		await this.drizzleConnection.database
			.delete(membershipsTable)
			.where(eq(membershipsTable.organizationId, organizationId));
	}

	async countByOrganization(organizationId: string): Promise<number> {
		const result = await this.drizzleConnection.database
			.select({ count: count() })
			.from(membershipsTable)
			.where(eq(membershipsTable.organizationId, organizationId));

		return result[0]?.count ?? 0;
	}

	async countOwnersByOrganization(organizationId: string): Promise<number> {
		const result = await this.drizzleConnection.database
			.select({ count: count() })
			.from(membershipsTable)
			.where(
				and(
					eq(membershipsTable.organizationId, organizationId),
					eq(membershipsTable.role, 'owner'),
				),
			);

		return result[0]?.count ?? 0;
	}
}
