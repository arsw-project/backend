import { Module } from '@nestjs/common';
import { CreateTicketUseCase } from '@tickets/application/use-cases/create-ticket.case';
import { DeleteTicketUseCase } from '@tickets/application/use-cases/delete-ticket.case';
import { GetAllTicketsByOrgUseCase } from '@tickets/application/use-cases/get-all-tickets-by-org.case';
import { GetTicketByIdUseCase } from '@tickets/application/use-cases/get-ticket-by-id.case';
import { GetTicketsByAssigneeUseCase } from '@tickets/application/use-cases/get-tickets-by-assignee.case';
import { GetTicketsByStatusUseCase } from '@tickets/application/use-cases/get-tickets-by-status.case';
import { GetTicketsByTagUseCase } from '@tickets/application/use-cases/get-tickets-by-tag.case';
import { UpdateAcceptanceCriteriaUseCase } from '@tickets/application/use-cases/update-acceptance-criteria.case';
import { UpdateTicketUseCase } from '@tickets/application/use-cases/update-ticket.case';
import { UpdateTicketAssigneeUseCase } from '@tickets/application/use-cases/update-ticket-assignee.case';
import { UpdateTicketStatusUseCase } from '@tickets/application/use-cases/update-ticket-status.case';
import { TicketRepository } from '@tickets/domain/ports/ticket.repository.port';
import { TicketDrizzleAdapter } from '@tickets/infrastructure/adapters/persistence/ticket-drizzle.adapter';
import { TicketRestController } from '@tickets/infrastructure/http/ticket-rest.controller';

@Module({
	controllers: [TicketRestController],
	providers: [
		{
			provide: TicketRepository,
			useClass: TicketDrizzleAdapter,
		},
		{
			provide: CreateTicketUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new CreateTicketUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: GetTicketByIdUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new GetTicketByIdUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: GetAllTicketsByOrgUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new GetAllTicketsByOrgUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: GetTicketsByAssigneeUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new GetTicketsByAssigneeUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: GetTicketsByStatusUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new GetTicketsByStatusUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: GetTicketsByTagUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new GetTicketsByTagUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: UpdateTicketUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new UpdateTicketUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: UpdateTicketStatusUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new UpdateTicketStatusUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: UpdateTicketAssigneeUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new UpdateTicketAssigneeUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: UpdateAcceptanceCriteriaUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new UpdateAcceptanceCriteriaUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
		{
			provide: DeleteTicketUseCase,
			useFactory: (ticketRepository: TicketRepository) => {
				return new DeleteTicketUseCase(ticketRepository);
			},
			inject: [TicketRepository],
		},
	],
	exports: [
		TicketRepository,
		CreateTicketUseCase,
		GetTicketByIdUseCase,
		GetAllTicketsByOrgUseCase,
		GetTicketsByAssigneeUseCase,
		GetTicketsByStatusUseCase,
		GetTicketsByTagUseCase,
		UpdateTicketUseCase,
		UpdateTicketStatusUseCase,
		UpdateTicketAssigneeUseCase,
		UpdateAcceptanceCriteriaUseCase,
		DeleteTicketUseCase,
	],
})
export class TicketsModule {}
