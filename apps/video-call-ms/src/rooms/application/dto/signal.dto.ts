import { z } from 'zod';

// RTCSessionDescriptionInit schema
const rtcSessionDescriptionSchema = z.object({
	type: z.enum(['offer', 'answer', 'pranswer', 'rollback']),
	sdp: z.string().optional(),
});

// RTCIceCandidateInit schema
const rtcIceCandidateSchema = z.object({
	candidate: z.string().optional(),
	sdpMid: z.string().nullable().optional(),
	sdpMLineIndex: z.number().nullable().optional(),
	usernameFragment: z.string().nullable().optional(),
});

// For offer/answer signaling
export const signalSchema = z.object({
	targetSocketId: z.string().min(1, 'Target socket ID is required'),
	signal: rtcSessionDescriptionSchema,
});

// For ICE candidate signaling
export const iceCandidateSchema = z.object({
	targetSocketId: z.string().min(1, 'Target socket ID is required'),
	signal: rtcIceCandidateSchema,
});

export type SignalDto = z.infer<typeof signalSchema>;
export type IceCandidateDto = z.infer<typeof iceCandidateSchema>;
