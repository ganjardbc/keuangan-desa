import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
// We use string[] to keep it clean and robust, matching 'BENDAHARA' | 'KETUA_RT' | 'WARGA'
