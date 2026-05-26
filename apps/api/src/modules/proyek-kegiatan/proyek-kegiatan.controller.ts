import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProyekKegiatanService } from './proyek-kegiatan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('proyek-kegiatan')
export class ProyekKegiatanController {
  constructor(private readonly proyekKegiatanService: ProyekKegiatanService) {}

  @Get()
  @RequirePermission('transaction:read')
  async findAll(@Request() req: any) {
    return this.proyekKegiatanService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @RequirePermission('transaction:read')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.proyekKegiatanService.findOne(id, req.user.tenantId);
  }

  @Post()
  @RequirePermission('transaction:create')
  async create(@Body() body: any, @Request() req: any) {
    return this.proyekKegiatanService.create(body, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermission('transaction:create')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.proyekKegiatanService.update(id, body, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermission('transaction:create')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.proyekKegiatanService.delete(id, req.user.tenantId);
  }
}
