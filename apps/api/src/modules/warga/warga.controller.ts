import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { WargaService } from './warga.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { Audit } from '../audit-log/audit.decorator';
import { AuditInterceptor } from '../audit-log/audit.interceptor';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('warga')
export class WargaController {
  constructor(private readonly wargaService: WargaService) {}

  @Get()
  @RequirePermission('warga:read')
  async findAll(@Request() req: any) {
    return this.wargaService.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermission('warga:write')
  @Audit('TAMBAH_WARGA')
  async create(@Body() body: any, @Request() req: any) {
    return this.wargaService.create(body, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermission('warga:write')
  @Audit('UBAH_WARGA')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.wargaService.update(id, body, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermission('warga:write')
  @Audit('HAPUS_WARGA')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.wargaService.delete(id, req.user.tenantId);
  }

  @Patch(':id/toggle')
  @RequirePermission('warga:write')
  async toggleStatus(@Param('id') id: string, @Request() req: any) {
    return this.wargaService.toggleStatus(id, req.user.tenantId);
  }

  @Post(':wargaId/iuran')
  @RequirePermission('warga:write')
  async assignIuran(
    @Param('wargaId') wargaId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.wargaService.assignIuran(wargaId, body, req.user.tenantId);
  }

  @Delete(':wargaId/iuran/:jenisIuranId')
  @RequirePermission('warga:write')
  async unassignIuran(
    @Param('wargaId') wargaId: string,
    @Param('jenisIuranId') jenisIuranId: string,
    @Request() req: any,
  ) {
    return this.wargaService.unassignIuran(
      wargaId,
      jenisIuranId,
      req.user.tenantId,
    );
  }

  @Get(':wargaId/iuran')
  @RequirePermission('warga:read')
  async getWargaIuran(@Param('wargaId') wargaId: string, @Request() req: any) {
    return this.wargaService.getWargaIuran(wargaId, req.user.tenantId);
  }

  @Post(':wargaId/pembayaran')
  @RequirePermission('warga:write')
  @Audit('CATAT_PEMBAYARAN')
  async recordPayment(
    @Param('wargaId') wargaId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.wargaService.recordPayment(
      wargaId,
      body,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Get('rekap-iuran/:year')
  @RequirePermission('warga:read')
  async getRekapIuran(@Param('year') year: string, @Request() req: any) {
    return this.wargaService.getRekapIuran(
      parseInt(year, 10),
      req.user.tenantId,
    );
  }
}
