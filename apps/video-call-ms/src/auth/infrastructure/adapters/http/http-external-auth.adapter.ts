import { SessionUser } from '@auth/domain/entities/session-user.entity';
import { ExternalAuthPort } from '@auth/domain/ports/external-auth.port';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface ValidateSessionResponse {
	valid: boolean;
	user?: SessionUser;
}

interface MembershipResponse {
	isMember: boolean;
}

@Injectable()
export class HttpExternalAuthAdapter implements ExternalAuthPort {
	private readonly logger = new Logger(HttpExternalAuthAdapter.name);
	private readonly monolithUrl: string;
	private readonly ticketsMsUrl: string;
	private readonly serviceToken: string;

	constructor(private readonly httpService: HttpService) {
		this.monolithUrl = process.env.MONOLITH_URL || 'http://localhost:3000';
		this.ticketsMsUrl = process.env.TICKETS_MS_URL || 'http://localhost:3001';
		this.serviceToken = process.env.SERVICE_SECRET_KEY || '';

		this.logger.log(`HttpExternalAuthAdapter initialized:`);
		this.logger.log(`  - Monolith URL: ${this.monolithUrl}`);
		this.logger.log(`  - Tickets MS URL: ${this.ticketsMsUrl}`);
		this.logger.log(
			`  - Service Token: ${this.serviceToken ? '***SET***' : '***NOT SET***'}`,
		);
	}

	async validateSession(sessionToken: string): Promise<SessionUser | null> {
		const url = `${this.monolithUrl}/internal/sessions/${encodeURIComponent(sessionToken)}/validate`;
		this.logger.debug(`[validateSession] URL: ${url}`);

		try {
			const response = await firstValueFrom(
				this.httpService.get<ValidateSessionResponse>(url, {
					headers: {
						'X-Service-Token': this.serviceToken,
					},
				}),
			);

			if (response.data?.valid && response.data?.user) {
				this.logger.log(
					`[validateSession] ✅ Session valid for user: ${response.data.user.id}`,
				);
				return response.data.user;
			}

			this.logger.warn(`[validateSession] ❌ Session invalid`);
			return null;
		} catch (err) {
			this.logger.error(`[validateSession] ❌ Request failed: ${err.message}`);
			return null;
		}
	}

	async validateMembership(
		userId: string,
		ticketId: string,
	): Promise<{ isMember: boolean; orgId?: string }> {
		this.logger.debug(
			`[validateMembership] Checking membership for user ${userId} on ticket ${ticketId}`,
		);

		try {
			// Step 1: Get ticket from tickets-ms to find orgId
			const ticketUrl = `${this.ticketsMsUrl}/internal/tickets/${ticketId}`;
			this.logger.debug(
				`[validateMembership] Getting ticket from ${ticketUrl}`,
			);

			const ticketResponse = await firstValueFrom(
				this.httpService.get<{ data: { orgId: string } }>(ticketUrl, {
					headers: {
						'X-Service-Token': this.serviceToken,
					},
				}),
			);

			const orgId = ticketResponse.data?.data?.orgId;
			if (!orgId) {
				this.logger.warn(
					`[validateMembership] ❌ Ticket ${ticketId} not found or has no orgId`,
				);
				return { isMember: false };
			}

			this.logger.debug(`[validateMembership] Found orgId: ${orgId}`);

			// Step 2: Check membership via monolith
			const membershipUrl = `${this.monolithUrl}/internal/organizations/${orgId}/members/${userId}/exists`;
			this.logger.debug(
				`[validateMembership] Checking membership at ${membershipUrl}`,
			);

			const membershipResponse = await firstValueFrom(
				this.httpService.get<MembershipResponse>(membershipUrl, {
					headers: {
						'X-Service-Token': this.serviceToken,
					},
				}),
			);

			const isMember = membershipResponse.data?.isMember ?? false;

			if (isMember) {
				this.logger.log(
					`[validateMembership] ✅ User ${userId} IS a member of org ${orgId}`,
				);
			} else {
				this.logger.warn(
					`[validateMembership] ❌ User ${userId} is NOT a member of org ${orgId}`,
				);
			}

			return { isMember, orgId };
		} catch (err) {
			this.logger.error(
				`[validateMembership] ❌ Request failed: ${err.message}`,
			);
			return { isMember: false };
		}
	}
}
