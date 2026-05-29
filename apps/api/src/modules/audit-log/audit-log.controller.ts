import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-log
   * Returns paginated audit log entries scoped to the current tenant's users.
   * Accessible by users with transaction:read permission.
   *
   * Query params:
   *   - page     (number, default: 1)
   *   - limit    (number, default: 20)
   *   - action   (string, optional filter)
   *   - userId   (string, optional filter)
   */
  @Get()
  @RequirePermission('transaction:read')
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('tenantId') tenantIdQuery?: string,
  ) {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const tenantId = isSuperAdmin ? (tenantIdQuery || undefined) : req.user.tenantId;

    return this.auditLogService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      action || undefined,
      userId || undefined,
    );
  }

  /**
   * GET /audit-log/action-types
   * Returns all distinct action types recorded for this tenant.
   * Used to populate filter dropdown on the frontend.
   */
  @Get('action-types')
  @RequirePermission('transaction:read')
  async getActionTypes(
    @Request() req: any,
    @Query('tenantId') tenantIdQuery?: string,
  ) {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const tenantId = isSuperAdmin ? (tenantIdQuery || undefined) : req.user.tenantId;
    return this.auditLogService.getActionTypes(tenantId);
  }
}
