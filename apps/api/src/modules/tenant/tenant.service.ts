import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        waReceiptTemplate: true,
        pdfHeaderTemplate: true,
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan.');
    }
    return tenant;
  }

  async updateSettings(
    tenantId: string,
    data: {
      waReceiptTemplate?: string;
      pdfHeaderTemplate?: string;
    },
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        waReceiptTemplate: data.waReceiptTemplate,
        pdfHeaderTemplate: data.pdfHeaderTemplate,
      },
    });
  }
}
