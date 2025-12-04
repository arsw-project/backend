import { ValidateMembershipUseCase } from '@auth/application/use-cases/validate-membership.case';
import { ValidateSessionUseCase } from '@auth/application/use-cases/validate-session.case';
import { sendChatMessageSchema } from '@chat/application/dto/send-chat-message.dto';
import { chatMessageToJson } from '@chat/domain/entities/chat-message.entity';
import { validateWsPayload } from '@common/validation/ws-validation';
import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { joinRoomSchema } from '@rooms/application/dto/join-room.dto';
import {
	iceCandidateSchema,
	signalSchema,
} from '@rooms/application/dto/signal.dto';
import { AddChatMessageUseCase } from '@rooms/application/use-cases/add-chat-message.case';
import { GetRoomUseCase } from '@rooms/application/use-cases/get-room.case';
import { JoinRoomUseCase } from '@rooms/application/use-cases/join-room.case';
import { LeaveRoomUseCase } from '@rooms/application/use-cases/leave-room.case';
import { TouchRoomUseCase } from '@rooms/application/use-cases/touch-room.case';
import type { Participant } from '@rooms/domain/entities/room.entity';
import { RoomRepository } from '@rooms/domain/ports/room.repository.port';
import { RoomInactivityChecker } from '@rooms/infrastructure/services/room-inactivity-checker.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	cors: {
		origin: '*',
		credentials: true,
	},
	namespace: '/video-call',
})
export class SignalingGateway
	implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(SignalingGateway.name);

	constructor(
		private readonly validateSessionUseCase: ValidateSessionUseCase,
		private readonly validateMembershipUseCase: ValidateMembershipUseCase,
		private readonly joinRoomUseCase: JoinRoomUseCase,
		private readonly leaveRoomUseCase: LeaveRoomUseCase,
		private readonly getRoomUseCase: GetRoomUseCase,
		private readonly addChatMessageUseCase: AddChatMessageUseCase,
		private readonly touchRoomUseCase: TouchRoomUseCase,
		private readonly roomInactivityChecker: RoomInactivityChecker,
		private readonly roomRepository: RoomRepository,
	) {}

	afterInit() {
		// Set up callback for when rooms are closed due to inactivity
		this.roomInactivityChecker.setOnRoomClosedCallback(
			(ticketId: string, participants: Participant[]) => {
				this.handleRoomClosedByInactivity(ticketId, participants);
			},
		);
		this.logger.log('SignalingGateway initialized with inactivity callback');
	}

	/**
	 * Handle room closed due to inactivity - disconnect all participants
	 */
	private handleRoomClosedByInactivity(
		ticketId: string,
		participants: Participant[],
	): void {
		this.logger.warn(
			`Room ${ticketId} closed due to inactivity. Disconnecting ${participants.length} participants.`,
		);

		// Notify all participants that the room was closed
		this.server.to(ticketId).emit('room-closed', {
			ticketId,
			reason: 'INACTIVITY',
			message: 'Room closed due to inactivity',
		});

		// Remove all sockets from the room
		for (const participant of participants) {
			const socket = this.server.sockets.sockets.get(participant.socketId);
			if (socket) {
				socket.leave(ticketId);
			}
		}
	}

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);
	}

	async handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);

		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		const result = this.leaveRoomUseCase.execute(client.id);

		if (result.ok && ticketId) {
			// Notify others that user left
			client.to(ticketId).emit('user-left', {
				socketId: client.id,
				user: result.value.participant?.user,
			});

			if (result.value.roomClosed) {
				this.logger.log(`Room ${ticketId} was closed`);
			}
		}
	}

	@SubscribeMessage('join-room')
	async handleJoinRoom(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: Socket,
	) {
		// Validate payload with Zod
		const validation = validateWsPayload(payload, joinRoomSchema);
		if (!validation.success) {
			client.emit('error', {
				message: 'Invalid payload',
				code: 'VALIDATION_ERROR',
				errors: validation.errors,
			});
			return;
		}

		const { ticketId, sessionToken } = validation.data;

		// 1. Validate session
		const sessionResult =
			await this.validateSessionUseCase.execute(sessionToken);
		if (!sessionResult.ok) {
			client.emit('error', {
				message: 'Invalid session',
				code: 'UNAUTHORIZED',
			});
			return;
		}
		const user = sessionResult.value;

		// 2. Validate membership
		const membershipResult = await this.validateMembershipUseCase.execute(
			user.id,
			ticketId,
		);
		if (!membershipResult.ok) {
			client.emit('error', {
				message: "You are not a member of this ticket's organization",
				code: 'FORBIDDEN',
			});
			return;
		}

		// 3. Join the room
		const joinResult = await this.joinRoomUseCase.execute(
			ticketId,
			membershipResult.value.orgId,
			client.id,
			user,
		);

		// 4. Join Socket.io room
		client.join(ticketId);

		// 5. Send current participants to the new user
		const otherParticipants = this.roomRepository.getOtherParticipants(
			ticketId,
			client.id,
		);
		client.emit('room-joined', {
			ticketId,
			user,
			participants: otherParticipants.map((p) => ({
				socketId: p.socketId,
				user: p.user,
			})),
			chatHistory: joinResult.value.chatHistory.map((m) =>
				chatMessageToJson(m),
			),
		});

		// 6. Notify others about new user
		client.to(ticketId).emit('user-joined', {
			socketId: client.id,
			user,
		});

		this.logger.log(`User ${user.name} joined room ${ticketId}`);
	}

	@SubscribeMessage('leave-room')
	handleLeaveRoom(@ConnectedSocket() client: Socket) {
		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		const result = this.leaveRoomUseCase.execute(client.id);

		if (result.ok && ticketId) {
			client.leave(ticketId);
			client.to(ticketId).emit('user-left', {
				socketId: client.id,
				user: result.value.participant?.user,
			});
			client.emit('room-left', { ticketId });
		}
	}

	// WebRTC Signaling: Offer
	@SubscribeMessage('offer')
	handleOffer(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: Socket,
	) {
		const validation = validateWsPayload(payload, signalSchema);
		if (!validation.success) {
			client.emit('error', {
				message: 'Invalid payload',
				code: 'VALIDATION_ERROR',
				errors: validation.errors,
			});
			return;
		}

		const { targetSocketId, signal } = validation.data;
		// Touch room to keep it active during signaling
		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		if (ticketId) {
			this.touchRoomUseCase.execute(ticketId);
		}
		this.server.to(targetSocketId).emit('offer', {
			senderSocketId: client.id,
			signal,
		});
	}

	// WebRTC Signaling: Answer
	@SubscribeMessage('answer')
	handleAnswer(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: Socket,
	) {
		const validation = validateWsPayload(payload, signalSchema);
		if (!validation.success) {
			client.emit('error', {
				message: 'Invalid payload',
				code: 'VALIDATION_ERROR',
				errors: validation.errors,
			});
			return;
		}

		const { targetSocketId, signal } = validation.data;
		// Touch room to keep it active during signaling
		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		if (ticketId) {
			this.touchRoomUseCase.execute(ticketId);
		}
		this.server.to(targetSocketId).emit('answer', {
			senderSocketId: client.id,
			signal,
		});
	}

	// WebRTC Signaling: ICE Candidate
	@SubscribeMessage('ice-candidate')
	handleIceCandidate(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: Socket,
	) {
		const validation = validateWsPayload(payload, iceCandidateSchema);
		if (!validation.success) {
			client.emit('error', {
				message: 'Invalid payload',
				code: 'VALIDATION_ERROR',
				errors: validation.errors,
			});
			return;
		}

		const { targetSocketId, signal } = validation.data;
		// Touch room to keep it active during signaling
		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		if (ticketId) {
			this.touchRoomUseCase.execute(ticketId);
		}
		this.server.to(targetSocketId).emit('ice-candidate', {
			senderSocketId: client.id,
			signal,
		});
	}

	// Chat: Send message
	@SubscribeMessage('chat-message')
	async handleChatMessage(
		@MessageBody() payload: unknown,
		@ConnectedSocket() client: Socket,
	) {
		const validation = validateWsPayload(payload, sendChatMessageSchema);
		if (!validation.success) {
			client.emit('error', {
				message: 'Invalid payload',
				code: 'VALIDATION_ERROR',
				errors: validation.errors,
			});
			return;
		}

		const room = this.getRoomUseCase.bySocketId(client.id);
		if (!room) {
			client.emit('error', { message: 'Not in a room', code: 'NOT_IN_ROOM' });
			return;
		}

		const participant = this.roomRepository.getParticipant(
			room.ticketId,
			client.id,
		);
		if (!participant) return;

		// Save message to database
		const messageResult = await this.addChatMessageUseCase.execute({
			ticketId: room.ticketId,
			orgId: room.orgId,
			userId: participant.user.id,
			userName: participant.user.name,
			content: validation.data.content,
		});

		if (messageResult.ok) {
			// Broadcast to all in room (including sender)
			this.server
				.to(room.ticketId)
				.emit('chat-message', chatMessageToJson(messageResult.value));
		}
	}

	// Screen share state notification
	@SubscribeMessage('screen-share-started')
	handleScreenShareStarted(@ConnectedSocket() client: Socket) {
		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		if (ticketId) {
			client.to(ticketId).emit('screen-share-started', {
				socketId: client.id,
			});
		}
	}

	@SubscribeMessage('screen-share-stopped')
	handleScreenShareStopped(@ConnectedSocket() client: Socket) {
		const ticketId = this.getRoomUseCase.getTicketIdForSocket(client.id);
		if (ticketId) {
			client.to(ticketId).emit('screen-share-stopped', {
				socketId: client.id,
			});
		}
	}
}
