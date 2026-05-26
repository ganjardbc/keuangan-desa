import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.transaction.findMany({
      where: { tenantId },
      include: { kasAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(tenantId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { tenantId },
    });

    const totalPemasukan = transactions
      .filter((t) => t.type === 'pemasukan')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalPengeluaran = transactions
      .filter((t) => t.type === 'pengeluaran')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSaldo = totalPemasukan - totalPengeluaran;

    return { totalPemasukan, totalPengeluaran, totalSaldo };
  }

  async create(
    tx: {
      type: 'pemasukan' | 'pengeluaran';
      title: string;
      amount: number;
      category: string;
      kasAccountId?: string;
      proyekKegiatanId?: string;
    },
    createdById: string,
    tenantId: string,
  ) {
    return this.prisma.$transaction(async (prismaClient) => {
      let targetAccountId = tx.kasAccountId;
      if (!targetAccountId) {
        const account = await prismaClient.kasAccount.findFirst({
          where: { tenantId },
        });
        if (!account) {
          throw new Error('Tidak ada akun kas terdaftar untuk desa Anda.');
        }
        targetAccountId = account.id;
      }

      const date = new Date().toISOString().split('T')[0];
      const newTx = await prismaClient.transaction.create({
        data: {
          type: tx.type,
          title: tx.title,
          amount: tx.amount,
          category: tx.category,
          date,
          kasAccountId: targetAccountId,
          proyekKegiatanId: tx.proyekKegiatanId || undefined,
          createdById,
          tenantId,
        },
      });

      const changeAmount = tx.type === 'pemasukan' ? tx.amount : -tx.amount;
      await prismaClient.kasAccount.update({
        where: { id: targetAccountId },
        data: {
          balance: {
            increment: changeAmount,
          },
        },
      });

      return newTx;
    });
  }

  async update(
    id: string,
    tx: {
      type: 'pemasukan' | 'pengeluaran';
      title: string;
      amount: number;
      category: string;
      kasAccountId?: string;
      proyekKegiatanId?: string;
    },
    tenantId: string,
  ) {
    return this.prisma.$transaction(async (prismaClient) => {
      const oldTx = await prismaClient.transaction.findFirst({
        where: { id, tenantId },
      });
      if (!oldTx) {
        throw new Error('Transaksi tidak ditemukan.');
      }

      // Reverse old transaction balance change
      const oldReverseAmount =
        oldTx.type === 'pemasukan' ? -oldTx.amount : oldTx.amount;
      await prismaClient.kasAccount.update({
        where: { id: oldTx.kasAccountId },
        data: { balance: { increment: oldReverseAmount } },
      });

      // Determine target account
      const targetAccountId = tx.kasAccountId || oldTx.kasAccountId;

      // Apply new transaction balance change
      const newChangeAmount = tx.type === 'pemasukan' ? tx.amount : -tx.amount;
      await prismaClient.kasAccount.update({
        where: { id: targetAccountId },
        data: { balance: { increment: newChangeAmount } },
      });

      // Update the transaction
      const updatedTx = await prismaClient.transaction.update({
        where: { id },
        data: {
          type: tx.type,
          title: tx.title,
          amount: tx.amount,
          category: tx.category,
          kasAccountId: targetAccountId,
          proyekKegiatanId: tx.proyekKegiatanId || null,
        },
      });

      return updatedTx;
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.$transaction(async (prismaClient) => {
      const tx = await prismaClient.transaction.findFirst({
        where: { id, tenantId },
      });
      if (!tx) {
        throw new Error('Transaksi tidak ditemukan.');
      }

      // Reverse transaction balance change
      const reverseAmount = tx.type === 'pemasukan' ? -tx.amount : tx.amount;
      await prismaClient.kasAccount.update({
        where: { id: tx.kasAccountId },
        data: { balance: { increment: reverseAmount } },
      });

      // Delete relation on PembayaranIuran if any
      await prismaClient.pembayaranIuran.deleteMany({
        where: { transactionId: id },
      });

      // Delete the transaction
      return prismaClient.transaction.delete({
        where: { id },
      });
    });
  }
}
