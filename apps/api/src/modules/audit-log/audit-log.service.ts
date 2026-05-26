import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit log entry.
   * @param userId - ID of the user performing the action
   * @param action - Short action identifier (e.g., 'LOGIN', 'TAMBAH_TRANSAKSI')
   * @param details - Human-readable description of what happened
   * @param ipAddress - Optional IP address of the request
   */
  async log(
    userId: string,
    action: string,
    details: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress: ipAddress ?? null,
        },
      });
    } catch {
      // Audit log failure should never crash the main request
    }
  }

  /**
   * Retrieves paginated audit logs for a tenant's users.
   * @param tenantId - Scopes the query to users belonging to this tenant
   * @param page - Page number (1-indexed)
   * @param limit - Records per page
   * @param action - Optional filter by action type
   * @param userId - Optional filter by specific user ID
   */
  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 20,
    action?: string,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      user: { tenantId },
    };

    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns all distinct action types recorded in the audit log for a tenant.
   * Used to populate filter dropdowns on the frontend.
   */
  async getActionTypes(tenantId: string): Promise<string[]> {
    const results = await this.prisma.auditLog.findMany({
      where: { user: { tenantId } },
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    return results.map((r) => r.action);
  }
}
