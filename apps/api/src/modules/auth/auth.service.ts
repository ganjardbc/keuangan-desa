import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
        tenant: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    const permissions = user.role.rolePermissions.map(
      (rp) => rp.permission.name,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      tenantId: user.tenantId,
      permissions,
    };
    const access_token = this.jwtService.sign(payload);

    // Log login event (fire-and-forget)
    void this.auditLogService.log(
      user.id,
      'LOGIN',
      `Pengguna ${user.name} (${user.email}) berhasil masuk ke sistem`,
    );

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        permissions,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          code: user.tenant.code,
          address: user.tenant.address,
          waReceiptTemplate: user.tenant.waReceiptTemplate,
          pdfHeaderTemplate: user.tenant.pdfHeaderTemplate,
        },
      },
    };
  }

  async register(data: {
    email: string;
    pass: string;
    name: string;
    isNewTenant: boolean;
    tenantCode?: string;
    newTenantName?: string;
    newTenantAddress?: string;
  }) {
    // 1. Check if email already registered
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    if (data.isNewTenant) {
      if (!data.newTenantName) {
        throw new BadRequestException('Nama Komunitas baru wajib diisi.');
      }

      // Auto-generate code if empty
      const generatedCode =
        'KAS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = data.tenantCode
        ? data.tenantCode.toUpperCase().replace(/\s+/g, '-')
        : generatedCode;

      // Check if code exists
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { code },
      });
      if (existingTenant) {
        throw new BadRequestException(
          'Kode Komunitas sudah digunakan. Pilih kode lain.',
        );
      }

      // Run inside $transaction to create tenant, kas account, and user Bendahara
      return this.prisma.$transaction(async (prismaClient) => {
        const newTenant = await prismaClient.tenant.create({
          data: {
            name: data.newTenantName!,
            code,
            address: data.newTenantAddress,
            waReceiptTemplate: [
              `🧾 *KUITANSI PEMBAYARAN IURAN*`,
              `━━━━━━━━━━━━━━━━━━━━━`,
              `👤 *Nama Warga  :* {nama}`,
              `🏠 *No. Rumah   :* {houseNumber}`,
              `📅 *Periode     :* {periode}`,
              `━━━━━━━━━━━━━━━━━━━━━`,
              `📋 *Jenis Iuran :* {jenisIuran}`,
              `💰 *Jumlah Bayar:* {jumlah}`,
              `📆 *Tgl Bayar   :* {tglBayar}`,
              `━━━━━━━━━━━━━━━━━━━━━`,
              `✅ _Pembayaran ini sah dan telah dicatat dalam sistem keuangan RT/RW._`,
              `_Terima kasih atas partisipasi Bapak/Ibu._ 🙏`,
            ].join('\n'),
            pdfHeaderTemplate: `${data.newTenantName}\n${data.newTenantAddress || ''}`,
          },
        });

        // Create Default Kas Account
        await prismaClient.kasAccount.create({
          data: {
            name: 'Kas Utama Tunai',
            balance: 0,
            tenantId: newTenant.id,
          },
        });

        // Find Bendahara Role
        const bendaharaRole = await prismaClient.role.findFirst({
          where: { name: 'BENDAHARA' },
        });
        if (!bendaharaRole) {
          throw new BadRequestException(
            'Role BENDAHARA tidak ditemukan di sistem.',
          );
        }

        const hashedPassword = await bcrypt.hash(data.pass, 10);
        const user = await prismaClient.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            roleId: bendaharaRole.id,
            tenantId: newTenant.id,
          },
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
            tenant: true,
          },
        });

        const permissions = user.role.rolePermissions.map(
          (rp) => rp.permission.name,
        );

        // Sign JWT token to automatically log in the registered user
        const payload = {
          sub: user.id,
          email: user.email,
          role: user.role.name,
          tenantId: user.tenantId,
          permissions,
        };
        const access_token = this.jwtService.sign(payload);

        // Log audit event
        void this.auditLogService.log(
          user.id,
          'REGISTRASI_TENANT',
          `Pengguna ${user.name} mendirikan tenant baru: ${newTenant.name} (${newTenant.code})`,
        );

        return {
          access_token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.name,
            permissions,
            tenant: {
              id: user.tenant.id,
              name: user.tenant.name,
              code: user.tenant.code,
              address: user.tenant.address,
              waReceiptTemplate: user.tenant.waReceiptTemplate,
              pdfHeaderTemplate: user.tenant.pdfHeaderTemplate,
            },
          },
        };
      });
    } else {
      // Joining an existing tenant
      if (!data.tenantCode) {
        throw new BadRequestException('Kode Komunitas wajib diisi.');
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { code: data.tenantCode.toUpperCase() },
      });
      if (!tenant) {
        throw new BadRequestException(
          'Kode Komunitas tidak valid / tidak ditemukan.',
        );
      }

      // Find Warga Role
      const wargaRole = await this.prisma.role.findFirst({
        where: { name: 'WARGA' },
      });
      if (!wargaRole) {
        throw new BadRequestException('Role WARGA tidak ditemukan di sistem.');
      }

      const hashedPassword = await bcrypt.hash(data.pass, 10);
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          roleId: wargaRole.id,
          tenantId: tenant.id,
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
          tenant: true,
        },
      });

      const permissions = user.role.rolePermissions.map(
        (rp) => rp.permission.name,
      );

      // Sign JWT token to automatically log in the registered user
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        tenantId: user.tenantId,
        permissions,
      };
      const access_token = this.jwtService.sign(payload);

      // Log audit event
      void this.auditLogService.log(
        user.id,
        'REGISTRASI_WARGA',
        `Pengguna ${user.name} bergabung ke tenant: ${tenant.name} (${tenant.code})`,
      );

      return {
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          permissions,
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            code: user.tenant.code,
            address: user.tenant.address,
            waReceiptTemplate: user.tenant.waReceiptTemplate,
            pdfHeaderTemplate: user.tenant.pdfHeaderTemplate,
          },
        },
      };
    }
  }
}
