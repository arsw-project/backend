export type MembershipRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Membership {
	id: string;
	userId: string;
	organizationId: string;
	role: MembershipRole;
	createdAt: Date;
	updatedAt: Date;
}
