import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProyekKegiatanService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const projects = await this.prisma.proyekKegiatan.findMany({
      where: { tenantId },
      include: {
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => {
      const spent = p.transactions
        .filter((t) => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...p,
        spent,
        remaining: p.budgetLimit - spent,
      };
    });
  }

  async findOne(id: string, tenantId: string) {
    const project = await this.prisma.proyekKegiatan.findFirst({
      where: { id, tenantId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Proyek dengan ID ${id} tidak ditemukan`);
    }

    const spent = project.transactions
      .filter((t) => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...project,
      spent,
      remaining: project.budgetLimit - spent,
    };
  }

  async create(
    data: {
      name: string;
      budgetLimit: number;
      startDate?: string;
      endDate?: string;
    },
    tenantId: string,
  ) {
    return this.prisma.proyekKegiatan.create({
      data: {
        name: data.name,
        budgetLimit: data.budgetLimit,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        tenantId,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      budgetLimit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
    tenantId: string,
  ) {
    const project = await this.prisma.proyekKegiatan.findFirst({
      where: { id, tenantId },
    });
    if (!project) {
      throw new NotFoundException(`Proyek dengan ID ${id} tidak ditemukan`);
    }

    return this.prisma.proyekKegiatan.update({
      where: { id },
      data: {
        name: data.name,
        budgetLimit: data.budgetLimit,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const project = await this.prisma.proyekKegiatan.findFirst({
      where: { id, tenantId },
    });
    if (!project) {
      throw new NotFoundException(`Proyek dengan ID ${id} tidak ditemukan`);
    }

    // Check if there are transactions connected to the project
    const transactionCount = await this.prisma.transaction.count({
      where: { proyekKegiatanId: id },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Tidak dapat menghapus proyek yang sudah memiliki riwayat pengeluaran kas.',
      );
    }

    return this.prisma.proyekKegiatan.delete({
      where: { id },
    });
  }
}
