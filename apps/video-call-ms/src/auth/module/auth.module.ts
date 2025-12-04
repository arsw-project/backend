import { ValidateMembershipUseCase } from '@auth/application/use-cases/validate-membership.case';
import { ValidateSessionUseCase } from '@auth/application/use-cases/validate-session.case';
import { ExternalAuthPort } from '@auth/domain/ports/external-auth.port';
import { HttpExternalAuthAdapter } from '@auth/infrastructure/adapters/http/http-external-auth.adapter';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

const ExternalAuthProvider = {
	provide: ExternalAuthPort,
	useClass: HttpExternalAuthAdapter,
};

@Module({
	imports: [HttpModule],
	providers: [
		ExternalAuthProvider,
		{
			provide: ValidateSessionUseCase,
			useFactory: (externalAuth: ExternalAuthPort) => {
				return new ValidateSessionUseCase(externalAuth);
			},
			inject: [ExternalAuthPort],
		},
		{
			provide: ValidateMembershipUseCase,
			useFactory: (externalAuth: ExternalAuthPort) => {
				return new ValidateMembershipUseCase(externalAuth);
			},
			inject: [ExternalAuthPort],
		},
	],
	exports: [ValidateSessionUseCase, ValidateMembershipUseCase],
})
export class AuthModule {}
