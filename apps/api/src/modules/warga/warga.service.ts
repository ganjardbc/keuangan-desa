import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WargaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.warga.findMany({
      where: { tenantId },
      include: {
        iuranBulanan: {
          include: {
            jenisIuran: true,
          },
        },
      },
    });
  }

  async create(
    data: {
      name: string;
      houseNumber: string;
      phoneNumber?: string;
      status: string;
    },
    tenantId: string,
  ) {
    return this.prisma.warga.create({
      data: {
        name: data.name,
        houseNumber: data.houseNumber,
        phoneNumber: data.phoneNumber,
        status: data.status,
        tenantId,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      houseNumber?: string;
      phoneNumber?: string;
      status?: string;
      isActive?: boolean;
    },
    tenantId: string,
  ) {
    const existing = await this.prisma.warga.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(`Warga dengan ID ${id} tidak ditemukan`);
    }

    return this.prisma.warga.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.prisma.warga.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(`Warga dengan ID ${id} tidak ditemukan`);
    }

    await this.prisma.iuranBulanan.deleteMany({ where: { wargaId: id } });
    await this.prisma.pembayaranIuran.deleteMany({ where: { wargaId: id } });

    return this.prisma.warga.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string, tenantId: string) {
    const warga = await this.prisma.warga.findUnique({
      where: { id },
    });
    if (!warga || warga.tenantId !== tenantId) {
      throw new NotFoundException(`Warga dengan ID ${id} tidak ditemukan`);
    }

    let nextStatus = 'sudah_bayar';
    if (warga.status === 'sudah_bayar') {
      nextStatus = 'belum_bayar';
    } else if (warga.status === 'belum_bayar') {
      nextStatus = 'menunggak';
    } else {
      nextStatus = 'sudah_bayar';
    }

    return this.prisma.warga.update({
      where: { id },
      data: { status: nextStatus },
    });
  }

  async assignIuran(
    wargaId: string,
    data: { jenisIuranId: string; customAmount?: number },
    tenantId: string,
  ) {
    const warga = await this.prisma.warga.findUnique({
      where: { id: wargaId },
    });
    if (!warga || warga.tenantId !== tenantId) {
      throw new NotFoundException('Warga tidak ditemukan');
    }
    const jenisIuran = await this.prisma.jenisIuran.findUnique({
      where: { id: data.jenisIuranId },
    });
    if (!jenisIuran || jenisIuran.tenantId !== tenantId) {
      throw new NotFoundException('Jenis Iuran tidak ditemukan');
    }

    const existing = await this.prisma.iuranBulanan.findFirst({
      where: { wargaId, jenisIuranId: data.jenisIuranId },
    });
    if (existing) {
      return this.prisma.iuranBulanan.update({
        where: { id: existing.id },
        data: { customAmount: data.customAmount },
      });
    }

    return this.prisma.iuranBulanan.create({
      data: {
        wargaId,
        jenisIuranId: data.jenisIuranId,
        customAmount: data.customAmount,
      },
    });
  }

  async unassignIuran(wargaId: string, jenisIuranId: string, tenantId: string) {
    const warga = await this.prisma.warga.findUnique({
      where: { id: wargaId },
    });
    if (!warga || warga.tenantId !== tenantId) {
      throw new NotFoundException('Warga tidak ditemukan');
    }

    const mapping = await this.prisma.iuranBulanan.findFirst({
      where: { wargaId, jenisIuranId },
    });
    if (!mapping) {
      throw new NotFoundException('Pemetaan iuran tidak ditemukan');
    }

    return this.prisma.iuranBulanan.delete({
      where: { id: mapping.id },
    });
  }

  async getWargaIuran(wargaId: string, tenantId: string) {
    const warga = await this.prisma.warga.findUnique({
      where: { id: wargaId },
    });
    if (!warga || warga.tenantId !== tenantId) {
      throw new NotFoundException('Warga tidak ditemukan');
    }

    return this.prisma.iuranBulanan.findMany({
      where: { wargaId },
      include: { jenisIuran: true },
    });
  }

  // 1. Record payment using database transaction
  async recordPayment(
    wargaId: string,
    data: {
      jenisIuranId: string;
      month: number;
      year: number;
      amountPaid: number;
      kasAccountId?: string;
    },
    createdById: string,
    tenantId: string,
  ) {
    const warga = await this.prisma.warga.findUnique({
      where: { id: wargaId },
    });
    if (!warga || warga.tenantId !== tenantId) {
      throw new NotFoundException('Warga tidak ditemukan');
    }

    const jenisIuran = await this.prisma.jenisIuran.findUnique({
      where: { id: data.jenisIuranId },
    });
    if (!jenisIuran || jenisIuran.tenantId !== tenantId) {
      throw new NotFoundException('Jenis Iuran tidak ditemukan');
    }

    const existingPayment = await this.prisma.pembayaranIuran.findFirst({
      where: {
        wargaId,
        jenisIuranId: data.jenisIuranId,
        month: data.month,
        year: data.year,
      },
    });
    if (existingPayment) {
      throw new BadRequestException(
        `Iuran ${jenisIuran.name} untuk bulan ${data.month}/${data.year} sudah dibayar.`,
      );
    }

    let targetAccountId = data.kasAccountId;
    if (!targetAccountId) {
      const account = await this.prisma.kasAccount.findFirst({
        where: { tenantId },
      });
      if (!account) {
        throw new BadRequestException(
          'Tidak ada akun kas terdaftar untuk desa Anda.',
        );
      }
      targetAccountId = account.id;
    }

    return this.prisma.$transaction(async (prismaClient) => {
      const dateStr = new Date().toISOString().split('T')[0];
      const tx = await prismaClient.transaction.create({
        data: {
          type: 'pemasukan',
          title: `Iuran ${jenisIuran.name} - ${warga.name} (Bulan ${data.month}/${data.year})`,
          amount: data.amountPaid,
          category: 'Iuran Warga',
          date: dateStr,
          kasAccountId: targetAccountId,
          createdById,
          tenantId,
        },
      });

      const pembayaran = await prismaClient.pembayaranIuran.create({
        data: {
          wargaId,
          jenisIuranId: data.jenisIuranId,
          transactionId: tx.id,
          month: data.month,
          year: data.year,
          amountPaid: data.amountPaid,
        },
      });

      await prismaClient.kasAccount.update({
        where: { id: targetAccountId },
        data: {
          balance: {
            increment: data.amountPaid,
          },
        },
      });

      await prismaClient.warga.update({
        where: { id: wargaId },
        data: { status: 'sudah_bayar' },
      });

      return pembayaran;
    });
  }

  // 2. Generate 12 months rekapitulasi iuran matrix data
  async getRekapIuran(year: number, tenantId: string) {
    const wargaList = await this.prisma.warga.findMany({
      where: { tenantId, isActive: true },
      include: {
        iuranBulanan: {
          include: { jenisIuran: true },
        },
        pembayaranIuran: {
          where: { year },
          include: { jenisIuran: true },
        },
      },
    });

    return wargaList.map((warga) => {
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthNumber = i + 1;
        const payments = warga.pembayaranIuran.filter(
          (p) => p.month === monthNumber,
        );

        return {
          month: monthNumber,
          isPaid: payments.length > 0,
          payments: payments.map((p) => ({
            id: p.id,
            jenisIuranName: p.jenisIuran.name,
            amountPaid: p.amountPaid,
            paidAt: p.paidAt,
          })),
        };
      });

      return {
        id: warga.id,
        name: warga.name,
        houseNumber: warga.houseNumber,
        phoneNumber: warga.phoneNumber,
        status: warga.status,
        iuranBulanan: warga.iuranBulanan,
        months,
      };
    });
  }
}
