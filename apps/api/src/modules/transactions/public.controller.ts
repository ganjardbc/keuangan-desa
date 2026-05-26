import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('transparansi/:tenantCode')
  async getPublicStats(@Param('tenantCode') tenantCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { code: tenantCode },
    });

    if (!tenant) {
      throw new NotFoundException('Desa/Tenant tidak ditemukan');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { tenantId: tenant.id },
      orderBy: { date: 'desc' },
    });

    const totalPemasukan = transactions
      .filter((t) => t.type === 'pemasukan')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalPengeluaran = transactions
      .filter((t) => t.type === 'pengeluaran')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSaldo = totalPemasukan - totalPengeluaran;

    return {
      villageName: tenant.name,
      stats: {
        totalPemasukan,
        totalPengeluaran,
        totalSaldo,
      },
      recentTransactions: transactions.slice(0, 15).map((t) => ({
        title: t.title,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
      })),
    };
  }
}
