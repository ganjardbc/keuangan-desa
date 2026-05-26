import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Audit } from '../audit-log/audit.decorator';
import { AuditInterceptor } from '../audit-log/audit.interceptor';

@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Tenants ---
  @Get('tenants')
  @Roles('SUPER_ADMIN')
  async getTenants() {
    return this.adminService.getTenants();
  }

  @Post('tenants')
  @Roles('SUPER_ADMIN')
  @Audit('ADMIN_TAMBAH_TENANT')
  async createTenant(@Body() body: any) {
    return this.adminService.createTenant(body);
  }

  @Put('tenants/:id')
  @Roles('SUPER_ADMIN')
  @Audit('ADMIN_UBAH_TENANT')
  async updateTenant(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateTenant(id, body);
  }

  // --- Users ---
  @Get('users')
  @Roles('SUPER_ADMIN')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  @Roles('SUPER_ADMIN')
  @Audit('ADMIN_TAMBAH_USER')
  async createUser(@Body() body: any) {
    return this.adminService.createUser(body);
  }

  @Put('users/:id')
  @Roles('SUPER_ADMIN')
  @Audit('ADMIN_UBAH_USER')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  // --- RBAC ---
  @Get('roles')
  @Roles('SUPER_ADMIN')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  @Roles('SUPER_ADMIN')
  @Audit('ADMIN_TAMBAH_ROLE')
  async createRole(@Body() body: { name: string; description?: string }) {
    return this.adminService.createRole(body);
  }

  @Get('permissions')
  @Roles('SUPER_ADMIN')
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  @Put('roles/:id/permissions')
  @Roles('SUPER_ADMIN')
  @Audit('ADMIN_UBAH_RBAC')
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body('permissionIds') permissionIds: string[],
  ) {
    return this.adminService.updateRolePermissions(roleId, permissionIds);
  }
}
