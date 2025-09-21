import { GoogleRestController } from '@auth/infrastructure/http/google-rest.controller';
import { ArcticService } from '@auth/infrastructure/services/arctic.service';
import { Module } from '@nestjs/common';
import { UsersModule } from '@users/module/users.module';

@Module({
	imports: [UsersModule],
	providers: [ArcticService],
	controllers: [GoogleRestController],
})
export class AuthModule {}
