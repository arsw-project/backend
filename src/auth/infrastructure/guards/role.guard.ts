import { Role } from '@auth/infrastructure/decorators/role.decorator';
import { RequestWithUser } from '@auth/infrastructure/middleware/session.middleware';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@users/domain/entities/user.entity';

const roleHierarchy: Record<UserRole, UserRole[]> = {
	user: ['user', 'admin', 'system'],
	admin: ['admin', 'system'],
	system: ['system'],
};

const matchRoles = (requiredRole: UserRole, userRole: UserRole): boolean => {
	return roleHierarchy[requiredRole]?.includes(userRole) ?? false;
};

@Injectable()
export class RoleGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const role = this.reflector.get(Role, context.getHandler()) as UserRole;

		if (!role) {
			return true;
		}

		const request: RequestWithUser = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user) {
			return false;
		}

		return matchRoles(role, user.role);
	}
}
