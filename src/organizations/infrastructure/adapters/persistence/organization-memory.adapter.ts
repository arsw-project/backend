import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '@organizations/application/dto/create-organization.dto';
import { Organization } from '@organizations/domain/entities/organization.entity';
import { OrganizationRepository } from '@organizations/domain/ports/persistence/organization-repository.port';

@Injectable()
export class OrganizationMemoryAdapter extends OrganizationRepository {
	private readonly organizations: Organization[] = [];

	create(organization: CreateOrganizationDto): Promise<Organization> {
		const now = new Date();
		const newOrganization: Organization = {
			...organization,
			id: (this.organizations.length + 1).toString(),
			createdAt: now,
			updatedAt: now,
		};

		this.organizations.push(newOrganization);
		return Promise.resolve(newOrganization);
	}

	findById(id: string): Promise<Organization | null> {
		const organization = this.organizations.find(
			(organization) => organization.id === id,
		);
		return Promise.resolve(organization || null);
	}

	findByName(name: string): Promise<Organization | null> {
		const organization = this.organizations.find(
			(organization) => organization.name === name,
		);
		return Promise.resolve(organization || null);
	}

	checkOrganizationConflict(
		organizationDto: CreateOrganizationDto,
	): Promise<boolean> {
		const conflictOrganization = this.organizations.find(
			(organization) => organization.name === organizationDto.name,
		);

		return Promise.resolve(!!conflictOrganization);
	}

	findAll(): Promise<Organization[]> {
		return Promise.resolve(this.organizations);
	}
}
