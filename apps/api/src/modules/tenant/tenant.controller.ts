import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { Audit } from '../audit-log/audit.decorator';
import { AuditInterceptor } from '../audit-log/audit.interceptor';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('settings')
  @RequirePermission('transaction:read')
  async getSettings(@Request() req: any) {
    return this.tenantService.getSettings(req.user.tenantId);
  }

  @Put('settings')
  @RequirePermission('transaction:create')
  @Audit('UBAH_PENGATURAN_KUITANSI')
  async updateSettings(@Body() body: any, @Request() req: any) {
    return this.tenantService.updateSettings(req.user.tenantId, body);
  }
}
