import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Tenant Management ---
  async getTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true, warga: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTenant(data: { name: string; code: string; address?: string }) {
    const existing = await this.prisma.tenant.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException('Kode Tenant sudah terdaftar.');
    }
    return this.prisma.tenant.create({ data });
  }

  async updateTenant(
    id: string,
    data: {
      name?: string;
      code?: string;
      address?: string;
      waReceiptTemplate?: string;
      pdfHeaderTemplate?: string;
    },
  ) {
    if (data.code) {
      const existing = await this.prisma.tenant.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('Kode Tenant sudah digunakan.');
      }
    }
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  // --- User Management ---
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        tenantId: true,
        tenant: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: {
    email: string;
    pass: string;
    name: string;
    roleId: string;
    tenantId: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar.');
    }
    const hashedPassword = await bcrypt.hash(data.pass, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        roleId: data.roleId,
        tenantId: data.tenantId,
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      email?: string;
      pass?: string;
      name?: string;
      roleId?: string;
      tenantId?: string;
    },
  ) {
    if (data.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('Email sudah digunakan.');
      }
    }

    const updateData: any = { ...data };
    if (data.pass) {
      updateData.password = await bcrypt.hash(data.pass, 10);
      delete updateData.pass;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // --- Role & Permission (RBAC) Management ---
  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async createRole(data: { name: string; description?: string }) {
    if (!data.name) {
      throw new BadRequestException('Nama Peran wajib diisi.');
    }
    const formattedName = data.name.toUpperCase().trim().replace(/\s+/g, '_');
    const existing = await this.prisma.role.findUnique({
      where: { name: formattedName },
    });
    if (existing) {
      throw new BadRequestException('Nama Peran sudah terdaftar.');
    }
    return this.prisma.role.create({
      data: {
        name: formattedName,
        description: data.description,
      },
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany();
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.$transaction(async (prismaClient) => {
      // Clear current mappings
      await prismaClient.rolePermission.deleteMany({
        where: { roleId },
      });
      // Add new mappings
      const newMappings = permissionIds.map((pId) => ({
        roleId,
        permissionId: pId,
      }));
      await prismaClient.rolePermission.createMany({
        data: newMappings,
      });
      return { success: true };
    });
  }
}
