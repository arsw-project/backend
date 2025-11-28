import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from '@tickets/application/dto/create-ticket.dto';
import { UpdateTicketDto } from '@tickets/application/dto/update-ticket.dto';
import {
	Difficulty,
	Ticket,
	TicketStatus,
} from '@tickets/domain/entities/ticket.entity';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';

@Injectable()
export class TicketMemoryAdapter extends TicketRepository {
	private readonly tickets: Ticket[] = [];

	create(createTicketDto: CreateTicketDto): Promise<Ticket> {
		const now = new Date();
		const ticket: Ticket = {
			id: randomUUID(),
			orgId: createTicketDto.orgId,
			title: createTicketDto.title,
			description: createTicketDto.description,
			acceptanceCriteria: [...createTicketDto.acceptanceCriteria],
			status: createTicketDto.status ?? 'Open',
			assigneeId: createTicketDto.assigneeId ?? null,
			difficulty: createTicketDto.difficulty,
			tags: [...createTicketDto.tags],
			createdBy: createTicketDto.createdBy,
			createdAt: now,
			updatedAt: now,
		};

		this.tickets.push(ticket);
		return Promise.resolve(this.cloneTicket(ticket));
	}

	findById(id: string): Promise<Ticket | null> {
		const ticket = this.tickets.find((item) => item.id === id);
		return Promise.resolve(ticket ? this.cloneTicket(ticket) : null);
	}

	findAllByOrgId(orgId: string): Promise<Ticket[]> {
		return Promise.resolve(
			this.tickets
				.filter((ticket) => ticket.orgId === orgId)
				.map(this.cloneTicket),
		);
	}

	findByAssigneeId(assigneeId: string): Promise<Ticket[]> {
		return Promise.resolve(
			this.tickets
				.filter((ticket) => ticket.assigneeId === assigneeId)
				.map(this.cloneTicket),
		);
	}

	findByTag(tag: string): Promise<Ticket[]> {
		return Promise.resolve(
			this.tickets
				.filter((ticket) => ticket.tags.includes(tag))
				.map(this.cloneTicket),
		);
	}

	findByCreatorId(creatorId: string): Promise<Ticket[]> {
		return Promise.resolve(
			this.tickets
				.filter((ticket) => ticket.createdBy === creatorId)
				.map(this.cloneTicket),
		);
	}

	findByStatus(status: TicketStatus): Promise<Ticket[]> {
		return Promise.resolve(
			this.tickets
				.filter((ticket) => ticket.status === status)
				.map(this.cloneTicket),
		);
	}

	findByDifficulty(difficulty: Difficulty): Promise<Ticket[]> {
		return Promise.resolve(
			this.tickets
				.filter((ticket) => ticket.difficulty === difficulty)
				.map(this.cloneTicket),
		);
	}

	update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket | null> {
		return this.applyUpdate(id, updateTicketDto);
	}

	updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
		return this.applyUpdate(id, { status });
	}

	updateAssignee(
		id: string,
		assigneeId: string | null,
	): Promise<Ticket | null> {
		return this.applyUpdate(id, { assigneeId });
	}

	updateDifficulty(id: string, difficulty: Difficulty): Promise<Ticket | null> {
		return this.applyUpdate(id, { difficulty });
	}

	delete(id: string): Promise<boolean> {
		const index = this.tickets.findIndex((ticket) => ticket.id === id);
		if (index === -1) {
			return Promise.resolve(false);
		}

		this.tickets.splice(index, 1);
		return Promise.resolve(true);
	}

	private applyUpdate(
		id: string,
		updates: Partial<Ticket>,
	): Promise<Ticket | null> {
		const index = this.tickets.findIndex((ticket) => ticket.id === id);
		if (index === -1) {
			return Promise.resolve(null);
		}

		const updated: Ticket = {
			...this.tickets[index],
			...updates,
			updatedAt: new Date(),
		};

		this.tickets[index] = updated;
		return Promise.resolve(this.cloneTicket(updated));
	}

	private readonly cloneTicket = (ticket: Ticket): Ticket => ({
		...ticket,
		acceptanceCriteria: [...ticket.acceptanceCriteria],
		tags: [...ticket.tags],
		createdAt: new Date(ticket.createdAt),
		updatedAt: new Date(ticket.updatedAt),
	});
}
