import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../users/entities/admin.entity';

export const Roles = (...roles: AdminRole[]) =>
  SetMetadata('roles', roles);
