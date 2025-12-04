import {
	Controller,
	Get,
	Headers,
	NotFoundException,
	Param,
	ParseUUIDPipe,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { GetTicketByIdUseCase } from '@tickets/application/use-cases/get-ticket-by-id.case';

/**
 * Internal controller for service-to-service communication.
 * Endpoints are authenticated via X-Service-Token header.
 * NOT exposed in Swagger documentation.
 */
@ApiExcludeController()
@Controller('internal/tickets')
export class TicketInternalController {
	private readonly serviceToken: string;

	constructor(private readonly getTicketByIdUseCase: GetTicketByIdUseCase) {
		this.serviceToken = process.env.SERVICE_SECRET_KEY || '';
	}

	/**
	 * Get ticket by ID for internal service use.
	 * Used by video-call-ms to get ticket's orgId for membership validation.
	 */
	@Get(':id')
	async getTicketById(
		@Param('id', ParseUUIDPipe) id: string,
		@Headers('x-service-token') token: string,
	) {
		// Validate service token
		if (!this.serviceToken || token !== this.serviceToken) {
			throw new UnauthorizedException('Invalid service token');
		}

		const result = await this.getTicketByIdUseCase.execute(id);

		if (!result.value) {
			throw new NotFoundException(`Ticket with id ${id} not found`);
		}

		return {
			data: {
				id: result.value.id,
				orgId: result.value.orgId,
				title: result.value.title,
				status: result.value.status,
				createdBy: result.value.createdBy,
				assigneeId: result.value.assigneeId,
			},
		};
	}
}
