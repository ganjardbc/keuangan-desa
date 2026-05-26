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
import { KasAccountService } from './kas-account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('kas-accounts')
export class KasAccountController {
  constructor(private readonly kasAccountService: KasAccountService) {}

  @Get()
  @RequirePermission('transaction:read')
  async findAll(@Request() req: any) {
    return this.kasAccountService.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermission('transaction:create')
  async create(@Body() body: any, @Request() req: any) {
    return this.kasAccountService.create(body, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermission('transaction:create')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.kasAccountService.update(id, body, req.user.tenantId);
  }

  @Delete(':id')
  @RequirePermission('transaction:create')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.kasAccountService.delete(id, req.user.tenantId);
  }
}
