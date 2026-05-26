import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JenisIuranService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.jenisIuran.findMany({
      where: { tenantId },
    });
  }

  async create(
    data: { name: string; defaultAmount: number; period: string },
    tenantId: string,
  ) {
    return this.prisma.jenisIuran.create({
      data: {
        name: data.name,
        defaultAmount: data.defaultAmount,
        period: data.period,
        tenantId,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; defaultAmount?: number; period?: string },
    tenantId: string,
  ) {
    const existing = await this.prisma.jenisIuran.findUnique({
      where: { id },
    });
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(
        `Jenis Iuran dengan ID ${id} tidak ditemukan`,
      );
    }

    return this.prisma.jenisIuran.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.prisma.jenisIuran.findUnique({
      where: { id },
    });
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(
        `Jenis Iuran dengan ID ${id} tidak ditemukan`,
      );
    }

    // Clean up associated mappings first
    await this.prisma.iuranBulanan.deleteMany({
      where: { jenisIuranId: id },
    });

    return this.prisma.jenisIuran.delete({
      where: { id },
    });
  }
}
