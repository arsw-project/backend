import { CreateTicketDto } from '@tickets/application/dto/create-ticket.dto';
import { UpdateTicketDto } from '@tickets/application/dto/update-ticket.dto';
import {
	Difficulty,
	Ticket,
	TicketStatus,
} from '@tickets/domain/entities/ticket.entity';

export abstract class TicketRepository {
	abstract create(createTicketDto: CreateTicketDto): Promise<Ticket>;

	abstract findById(id: string): Promise<Ticket | null>;

	abstract findAllByOrgId(orgId: string): Promise<Ticket[]>;

	abstract findByAssigneeId(assigneeId: string): Promise<Ticket[]>;

	abstract findByTag(tag: string): Promise<Ticket[]>;

	abstract findByCreatorId(creatorId: string): Promise<Ticket[]>;

	abstract findByStatus(status: TicketStatus): Promise<Ticket[]>;

	abstract findByDifficulty(difficulty: Difficulty): Promise<Ticket[]>;

	abstract update(
		id: string,
		updateTicketDto: UpdateTicketDto,
	): Promise<Ticket | null>;

	abstract updateStatus(
		id: string,
		status: TicketStatus,
	): Promise<Ticket | null>;

	abstract updateAssignee(
		id: string,
		assigneeId: string | null,
	): Promise<Ticket | null>;

	abstract updateDifficulty(
		id: string,
		difficulty: Difficulty,
	): Promise<Ticket | null>;

	abstract delete(id: string): Promise<boolean>;

	/**
	 * Elimina todos los tickets de una organización.
	 * Usado para limpieza cuando se detecta que la organización ya no existe.
	 *
	 * @param orgId - UUID de la organización
	 * @returns Número de tickets eliminados
	 */
	abstract deleteByOrganizationId(orgId: string): Promise<number>;

	/**
	 * Elimina todos los tickets creados por un usuario.
	 * Usado para limpieza cuando se detecta que el usuario ya no existe.
	 *
	 * @param creatorId - UUID del usuario creador
	 * @returns Número de tickets eliminados
	 */
	abstract deleteByCreatorId(creatorId: string): Promise<number>;
}
