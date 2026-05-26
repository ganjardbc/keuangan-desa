import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KasAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.kasAccount.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    data: { name: string; accountNumber?: string; balance?: number },
    tenantId: string,
  ) {
    return this.prisma.kasAccount.create({
      data: {
        name: data.name,
        accountNumber: data.accountNumber,
        balance: data.balance ?? 0,
        tenantId,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; accountNumber?: string; balance?: number },
    tenantId: string,
  ) {
    const existing = await this.prisma.kasAccount.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(`Akun Kas dengan ID ${id} tidak ditemukan`);
    }

    return this.prisma.kasAccount.update({
      where: { id },
      data: {
        name: data.name,
        accountNumber: data.accountNumber,
        balance: data.balance,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.prisma.kasAccount.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(`Akun Kas dengan ID ${id} tidak ditemukan`);
    }

    // Check if there are transactions associated with this account
    const transactionCount = await this.prisma.transaction.count({
      where: { kasAccountId: id },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Tidak dapat menghapus akun kas yang memiliki riwayat transaksi.',
      );
    }

    return this.prisma.kasAccount.delete({
      where: { id },
    });
  }
}
