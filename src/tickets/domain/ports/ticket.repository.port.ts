import {CreateTicketDto} from '@tickets/application/dto/create-ticket.dto';
import { TicketStatus, Difficulty , Ticket } from '../entities/ticket.entity';

export abstract class TicketRepository {
    abstract create(createTicketDto: CreateTicketDto): Promise<Ticket>;

    abstract findById(id: string): Promise<Ticket | null>;

    abstract findAllByOrgId(orgId: string): Promise<Ticket[]>;

    abstract findByAssigneeId(assigneeId: string): Promise<Ticket[]>;

    abstract findByTag(tag: string): Promise<Ticket[]>;

    abstract findByCreatorId(creatorId: string): Promise<Ticket[]>;

    abstract findByStatus(status: TicketStatus): Promise<Ticket[]>;
    
    abstract findByDifficulty(difficulty: Difficulty): Promise<Ticket[]>;

    abstract updateStatus(id: string, status: TicketStatus): Promise<Ticket | null>;

    abstract updateAssignee(id: string, assigneeId: string | null): Promise<Ticket | null>;

    abstract updateDifficulty(id: string, difficulty: Difficulty): Promise<Ticket | null>;

    abstract delete(id: string): Promise<boolean>;
    
}