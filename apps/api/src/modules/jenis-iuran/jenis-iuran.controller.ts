import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JenisIuranService } from './jenis-iuran.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('jenis-iuran')
export class JenisIuranController {
  constructor(private readonly jenisIuranService: JenisIuranService) {}

  @Get()
  @RequirePermission('warga:read')
  async findAll(@Request() req: any) {
    return this.jenisIuranService.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermission('warga:write')
  async create(@Body() body: any, @Request() req: any) {
    return this.jenisIuranService.create(body, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermission('warga:write')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.jenisIuranService.update(id, body, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermission('warga:write')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.jenisIuranService.delete(id, req.user.tenantId);
  }
}
