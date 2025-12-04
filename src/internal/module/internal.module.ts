import { AuthModule } from '@auth/module/auth.module';
import { InternalRestController } from '@internal/infrastructure/http/internal-rest.controller';
import { Module } from '@nestjs/common';
import { OrganizationsModule } from '@organizations/module/organizations.module';
import { UsersModule } from '@users/module/users.module';

@Module({
	imports: [UsersModule, OrganizationsModule, AuthModule],
	controllers: [InternalRestController],
})
export class InternalModule {}
