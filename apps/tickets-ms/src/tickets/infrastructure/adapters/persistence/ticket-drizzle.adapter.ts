import { DrizzleConnection } from '@drizzle/drizzle.connection';
import { Injectable, Logger } from '@nestjs/common';
import { CreateTicketDto } from '@tickets/application/dto/create-ticket.dto';
import { UpdateTicketDto } from '@tickets/application/dto/update-ticket.dto';
import {
	Difficulty,
	Ticket,
	TicketStatus,
} from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { ticketsTable } from '@tickets/infrastructure/entities/ticket.drizzle-schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TicketDrizzleAdapter implements TicketRepository {
	private readonly logger = new Logger(TicketDrizzleAdapter.name);

	constructor(private readonly drizzleConnection: DrizzleConnection) {}

	async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
		const [ticket] = await this.drizzleConnection.database
			.insert(ticketsTable)
			.values({
				orgId: createTicketDto.orgId,
				title: createTicketDto.title,
				description: createTicketDto.description,
				acceptanceCriteria: createTicketDto.acceptanceCriteria,
				status: createTicketDto.status ?? 'Open',
				assigneeId: createTicketDto.assigneeId ?? null,
				difficulty: createTicketDto.difficulty,
				tags: createTicketDto.tags,
				createdBy: createTicketDto.createdBy,
			})
			.returning();

		return ticket;
	}

	async findById(id: string): Promise<Ticket | null> {
		const ticket = await this.drizzleConnection.database
			.select()
			.from(ticketsTable)
			.where(eq(ticketsTable.id, id))
			.limit(1);
		if (ticket.length === 0) {
			return null;
		}
		return ticket[0];
	}
	async findAllByOrgId(orgId: string): Promise<Ticket[]> {
		const tickets = await this.drizzleConnection.database
			.select()
			.from(ticketsTable)
			.where(eq(ticketsTable.orgId, orgId));
		return tickets;
	}

	async findByAssigneeId(assigneeId: string): Promise<Ticket[]> {
		const tickets = await this.drizzleConnection.database
			.select()
			.from(ticketsTable)
			.where(eq(ticketsTable.assigneeId, assigneeId));
		return tickets;
	}

	async findByTag(tag: string): Promise<Ticket[]> {
		const tickets = await this.drizzleConnection.database
			.select()
			.from(ticketsTable);
		return tickets.filter((ticket) => ticket.tags?.includes(tag));
	}

	async findByCreatorId(creatorId: string): Promise<Ticket[]> {
		const tickets = await this.drizzleConnection.database
			.select()
			.from(ticketsTable)
			.where(eq(ticketsTable.createdBy, creatorId));
		return tickets;
	}

	async findByStatus(status: TicketStatus): Promise<Ticket[]> {
		const tickets = await this.drizzleConnection.database
			.select()
			.from(ticketsTable)
			.where(eq(ticketsTable.status, status));
		return tickets;
	}

	async findByDifficulty(difficulty: Difficulty): Promise<Ticket[]> {
		const tickets = await this.drizzleConnection.database
			.select()
			.from(ticketsTable)
			.where(eq(ticketsTable.difficulty, difficulty));
		return tickets;
	}

	async update(
		id: string,
		updateTicketDto: UpdateTicketDto,
	): Promise<Ticket | null> {
		return this.updateTicket(id, { ...updateTicketDto, updatedAt: new Date() });
	}

	async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
		return this.updateTicket(id, { status, updatedAt: new Date() });
	}

	async updateAssignee(
		id: string,
		assigneeId: string | null,
	): Promise<Ticket | null> {
		return this.updateTicket(id, { assigneeId, updatedAt: new Date() });
	}

	async updateDifficulty(
		id: string,
		difficulty: Difficulty,
	): Promise<Ticket | null> {
		return this.updateTicket(id, { difficulty, updatedAt: new Date() });
	}

	private async updateTicket(
		id: string,
		data: Partial<Ticket>,
	): Promise<Ticket | null> {
		const [ticket] = await this.drizzleConnection.database
			.update(ticketsTable)
			.set(data)
			.where(eq(ticketsTable.id, id))
			.returning();
		return ticket ?? null;
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.drizzleConnection.database
			.delete(ticketsTable)
			.where(eq(ticketsTable.id, id))
			.returning({ id: ticketsTable.id });
		return result.length > 0;
	}

	async deleteByOrganizationId(orgId: string): Promise<number> {
		const result = await this.drizzleConnection.database
			.delete(ticketsTable)
			.where(eq(ticketsTable.orgId, orgId))
			.returning({ id: ticketsTable.id, title: ticketsTable.title });

		if (result.length > 0) {
			this.logger.warn(
				`Deleted ${result.length} orphan tickets for non-existent organization '${orgId}': ${result.map((t) => `${t.id} (${t.title})`).join(', ')}`,
			);
		}

		return result.length;
	}

	async deleteByCreatorId(creatorId: string): Promise<number> {
		const result = await this.drizzleConnection.database
			.delete(ticketsTable)
			.where(eq(ticketsTable.createdBy, creatorId))
			.returning({ id: ticketsTable.id, title: ticketsTable.title });

		if (result.length > 0) {
			this.logger.warn(
				`Deleted ${result.length} orphan tickets for non-existent user '${creatorId}': ${result.map((t) => `${t.id} (${t.title})`).join(', ')}`,
			);
		}

		return result.length;
	}
}
