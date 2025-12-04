import {
	Membership,
	MembershipRole,
} from '@organizations/domain/entities/membership.entity';

export interface CreateMembershipData {
	userId: string;
	organizationId: string;
	role: MembershipRole;
}

export interface UpdateMembershipData {
	role?: MembershipRole;
}

export abstract class MembershipRepository {
	abstract create(data: CreateMembershipData): Promise<Membership>;

	abstract findById(id: string): Promise<Membership | null>;

	abstract findByUserAndOrganization(
		userId: string,
		organizationId: string,
	): Promise<Membership | null>;

	abstract findByOrganization(organizationId: string): Promise<Membership[]>;

	abstract findByUser(userId: string): Promise<Membership[]>;

	abstract update(
		id: string,
		data: UpdateMembershipData,
	): Promise<Membership | null>;

	abstract delete(id: string): Promise<void>;

	abstract deleteByOrganization(organizationId: string): Promise<void>;

	abstract countByOrganization(organizationId: string): Promise<number>;

	abstract countOwnersByOrganization(organizationId: string): Promise<number>;
}
