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

  async recordBulkPayment(
    wargaId: string,
    data: {
      payments: {
        jenisIuranId: string;
        month: number;
        year: number;
        amountPaid: number;
      }[];
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

    if (!data.payments || data.payments.length === 0) {
      throw new BadRequestException('Daftar pembayaran kosong.');
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

    const jenisIuranIds = Array.from(
      new Set(data.payments.map((p) => p.jenisIuranId)),
    );
    const jenisIurans = await this.prisma.jenisIuran.findMany({
      where: {
        id: { in: jenisIuranIds },
        tenantId,
      },
    });
    if (jenisIurans.length !== jenisIuranIds.length) {
      throw new BadRequestException(
        'Satu atau lebih Jenis Iuran tidak ditemukan.',
      );
    }
    const jenisIuranMap = new Map(jenisIurans.map((ji) => [ji.id, ji]));

    const existingPayments = await this.prisma.pembayaranIuran.findMany({
      where: {
        wargaId,
        OR: data.payments.map((p) => ({
          jenisIuranId: p.jenisIuranId,
          month: p.month,
          year: p.year,
        })),
      },
    });
    if (existingPayments.length > 0) {
      const alreadyPaidNames = existingPayments.map((ep) => {
        const ji = jenisIuranMap.get(ep.jenisIuranId);
        return `${ji?.name ?? 'Iuran'} (${ep.month}/${ep.year})`;
      });
      throw new BadRequestException(
        `Pembayaran iuran berikut sudah tercatat sebelumnya: ${alreadyPaidNames.join(', ')}`,
      );
    }

    const totalAmount = data.payments.reduce((sum, p) => sum + p.amountPaid, 0);

    return this.prisma.$transaction(async (prismaClient) => {
      const dateStr = new Date().toISOString().split('T')[0];
      const paymentRecords = [];

      for (const p of data.payments) {
        const ji = jenisIuranMap.get(p.jenisIuranId);
        const txName = `Iuran ${ji?.name ?? 'Iuran'} - ${warga.name} (Bulan ${p.month}/${p.year})`;

        const tx = await prismaClient.transaction.create({
          data: {
            type: 'pemasukan',
            title: txName,
            amount: p.amountPaid,
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
            jenisIuranId: p.jenisIuranId,
            transactionId: tx.id,
            month: p.month,
            year: p.year,
            amountPaid: p.amountPaid,
          },
        });
        paymentRecords.push(pembayaran);
      }

      await prismaClient.kasAccount.update({
        where: { id: targetAccountId },
        data: {
          balance: {
            increment: totalAmount,
          },
        },
      });

      await prismaClient.warga.update({
        where: { id: wargaId },
        data: { status: 'sudah_bayar' },
      });

      return paymentRecords;
    });
  }

  async recordBulkAllPayment(
    data: {
      wargaIds: string[];
      jenisIuranId: string;
      month: number;
      year: number;
      kasAccountId?: string;
    },
    createdById: string,
    tenantId: string,
  ) {
    if (!data.wargaIds || data.wargaIds.length === 0) {
      throw new BadRequestException('Daftar warga terpilih kosong.');
    }

    const jenisIuran = await this.prisma.jenisIuran.findFirst({
      where: { id: data.jenisIuranId, tenantId },
    });
    if (!jenisIuran) {
      throw new NotFoundException('Jenis Iuran tidak ditemukan.');
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

    const eligibleWarga = await this.prisma.warga.findMany({
      where: {
        id: { in: data.wargaIds },
        tenantId,
        isActive: true,
        iuranBulanan: {
          some: { jenisIuranId: data.jenisIuranId },
        },
      },
      include: {
        iuranBulanan: {
          where: { jenisIuranId: data.jenisIuranId },
        },
        pembayaranIuran: {
          where: {
            jenisIuranId: data.jenisIuranId,
            month: data.month,
            year: data.year,
          },
        },
      },
    });

    const unpaidWarga = eligibleWarga.filter(
      (w) => w.pembayaranIuran.length === 0,
    );

    if (unpaidWarga.length === 0) {
      throw new BadRequestException(
        'Semua warga terpilih sudah membayar iuran ini untuk periode tersebut.',
      );
    }

    return this.prisma.$transaction(async (prismaClient) => {
      const dateStr = new Date().toISOString().split('T')[0];
      const paymentRecords = [];
      let totalAmount = 0;

      for (const w of unpaidWarga) {
        const iuranMapping = w.iuranBulanan[0];
        const amountToPay =
          iuranMapping.customAmount ?? jenisIuran.defaultAmount;
        totalAmount += amountToPay;

        const txName = `Iuran ${jenisIuran.name} - ${w.name} (Bulan ${data.month}/${data.year})`;

        const tx = await prismaClient.transaction.create({
          data: {
            type: 'pemasukan',
            title: txName,
            amount: amountToPay,
            category: 'Iuran Warga',
            date: dateStr,
            kasAccountId: targetAccountId,
            createdById,
            tenantId,
          },
        });

        const pembayaran = await prismaClient.pembayaranIuran.create({
          data: {
            wargaId: w.id,
            jenisIuranId: data.jenisIuranId,
            transactionId: tx.id,
            month: data.month,
            year: data.year,
            amountPaid: amountToPay,
          },
        });
        paymentRecords.push(pembayaran);
      }

      await prismaClient.kasAccount.update({
        where: { id: targetAccountId },
        data: {
          balance: {
            increment: totalAmount,
          },
        },
      });

      await prismaClient.warga.updateMany({
        where: {
          id: { in: unpaidWarga.map((w) => w.id) },
        },
        data: { status: 'sudah_bayar' },
      });

      return paymentRecords;
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
