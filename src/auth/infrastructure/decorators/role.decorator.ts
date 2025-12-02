import { Reflector } from '@nestjs/core';
import { UserRole } from '@users/domain/entities/user.entity';

export const Role = Reflector.createDecorator<UserRole>();
