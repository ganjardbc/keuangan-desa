import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { Audit } from '../audit-log/audit.decorator';
import { AuditInterceptor } from '../audit-log/audit.interceptor';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequirePermission('transaction:read')
  async findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.tenantId);
  }

  @Get('stats')
  @RequirePermission('transaction:read')
  async getStats(@Request() req: any) {
    return this.transactionsService.getStats(req.user.tenantId);
  }

  @Post()
  @RequirePermission('transaction:create')
  @Audit('TAMBAH_TRANSAKSI')
  async create(@Body() tx: any, @Request() req: any) {
    return this.transactionsService.create(tx, req.user.id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermission('transaction:create')
  @Audit('UBAH_TRANSAKSI')
  async update(@Param('id') id: string, @Body() tx: any, @Request() req: any) {
    return this.transactionsService.update(id, tx, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermission('transaction:create')
  @Audit('HAPUS_TRANSAKSI')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.delete(id, req.user.tenantId);
  }
}
