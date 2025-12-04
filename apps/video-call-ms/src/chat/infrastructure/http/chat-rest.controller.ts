import { GetChatHistoryPaginatedUseCase } from '@chat/application/use-cases/get-chat-history-paginated.case';
import { chatMessageToJson } from '@chat/domain/entities/chat-message.entity';
import {
	BadRequestErrorDto,
	InternalServerErrorDto,
} from '@common/swagger/api-error.dto';
import {
	Controller,
	DefaultValuePipe,
	Get,
	Param,
	ParseIntPipe,
	ParseUUIDPipe,
	Query,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ChatHistoryResponseDto } from '../swagger/chat.swagger';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
	constructor(
		private readonly getChatHistoryPaginatedUseCase: GetChatHistoryPaginatedUseCase,
	) {}

	/**
	 * Get chat history for a ticket
	 * GET /chat/:ticketId
	 */
	@Get(':ticketId')
	@ApiOperation({
		summary: 'Obtener historial de chat de un ticket',
		description:
			'Obtiene el historial de mensajes de chat para un ticket específico con soporte de paginación.',
	})
	@ApiParam({
		name: 'ticketId',
		description: 'ID del ticket (UUID)',
		example: '123e4567-e89b-12d3-a456-426614174000',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Número máximo de mensajes a retornar',
		example: 50,
		type: Number,
	})
	@ApiQuery({
		name: 'offset',
		required: false,
		description: 'Número de mensajes a omitir desde el inicio',
		example: 0,
		type: Number,
	})
	@ApiResponse({
		status: 200,
		description: 'Historial de chat obtenido exitosamente',
		type: ChatHistoryResponseDto,
	})
	@ApiBadRequestResponse({
		description: 'ID de ticket inválido',
		type: BadRequestErrorDto,
	})
	@ApiInternalServerErrorResponse({
		description: 'Error interno del servidor',
		type: InternalServerErrorDto,
	})
	async getChatHistory(
		@Param('ticketId', ParseUUIDPipe) ticketId: string,
		@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
		@Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
	) {
		const result = await this.getChatHistoryPaginatedUseCase.execute(
			ticketId,
			limit,
			offset,
		);

		const { messages, total } = result.value;

		return {
			data: messages.map((m) => chatMessageToJson(m)),
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + messages.length < total,
			},
		};
	}
}
