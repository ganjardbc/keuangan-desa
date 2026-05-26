import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding multi-tenant RBAC database...');

  // Clean existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.pembayaranIuran.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.proyekKegiatan.deleteMany();
  await prisma.kasAccount.deleteMany();
  await prisma.iuranBulanan.deleteMany();
  await prisma.jenisIuran.deleteMany();
  await prisma.warga.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Create Tenant (SaaS Organization)
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Desa Sukamaju (RT 03 / RW 04)',
      code: 'DS-SUKAMAJU',
      address: 'Kecamatan Caringin, Bogor',
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
        `_Terima kasih atas partisipasi Bapak/Ibu._ 🙏`
      ].join('\n'),
      pdfHeaderTemplate: 'Desa Sukamaju (RT 03 / RW 04)\nKecamatan Caringin, Bogor',
    },
  });
  console.log('Tenant created:', tenant.name);

  // 2. Create Roles
  const roleSuperAdmin = await prisma.role.create({
    data: { name: 'SUPER_ADMIN', description: 'Super Administrator dengan akses penuh lintas tenant' },
  });
  const roleBendahara = await prisma.role.create({
    data: { name: 'BENDAHARA', description: 'Hak akses penuh mengelola keuangan dan data warga' },
  });
  const roleRT = await prisma.role.create({
    data: { name: 'KETUA_RT', description: 'Hak akses peninjauan data kas dan warga' },
  });
  const roleWarga = await prisma.role.create({
    data: { name: 'WARGA', description: 'Hak akses publik melihat laporan kas' },
  });
  const roleSekretaris = await prisma.role.create({
    data: { name: 'SEKRETARIS_RT', description: 'Membantu Bendahara mengelola administrasi surat' },
  });
  const roleRW = await prisma.role.create({
    data: { name: 'KETUA_RW', description: 'Hak akses peninjauan laporan kas tingkat RW' },
  });
  console.log('Roles created.');

  // 3. Create Permissions
  const permissions = [
    { name: 'transaction:create', description: 'Membuat transaksi kas baru' },
    { name: 'transaction:read', description: 'Melihat riwayat transaksi kas' },
    { name: 'warga:write', description: 'Mengelola data profil warga dan iuran' },
    { name: 'warga:read', description: 'Melihat data warga' },
    { name: 'report:export', description: 'Mengunduh laporan PDF/Excel' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const p = await prisma.permission.create({ data: perm });
    createdPermissions.push(p);
  }
  console.log('Permissions created.');

  // 4. Map Permissions to Roles
  // Super Admin gets all
  for (const perm of createdPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: roleSuperAdmin.id, permissionId: perm.id },
    });
  }
  // Bendahara gets all
  for (const perm of createdPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: roleBendahara.id, permissionId: perm.id },
    });
  }
  // Ketua RT gets read access & report export
  const rtPerms = createdPermissions.filter(p => 
    ['transaction:read', 'warga:read', 'report:export'].includes(p.name)
  );
  for (const perm of rtPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roleRT.id, permissionId: perm.id },
    });
  }
  // Warga gets transaction:read only
  const wargaPerms = createdPermissions.filter(p => p.name === 'transaction:read');
  for (const perm of wargaPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roleWarga.id, permissionId: perm.id },
    });
  }
  // Sekretaris RT gets transaction:read and warga:read
  const sekPerms = createdPermissions.filter(p => 
    ['transaction:read', 'warga:read'].includes(p.name)
  );
  for (const perm of sekPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roleSekretaris.id, permissionId: perm.id },
    });
  }
  // Ketua RW gets transaction:read and report:export
  const rwPerms = createdPermissions.filter(p => 
    ['transaction:read', 'report:export'].includes(p.name)
  );
  for (const perm of rwPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roleRW.id, permissionId: perm.id },
    });
  }
  console.log('RolePermissions mapped.');

  // 5. Create Users
  const hashedSuperPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.create({
    data: {
      email: 'superadmin@kaskita.com',
      password: hashedSuperPassword,
      name: 'Super Admin',
      roleId: roleSuperAdmin.id,
      tenantId: tenant.id,
    },
  });

  const hashedPassword = await bcrypt.hash('bendahara123', 10);
  const bendahara = await prisma.user.create({
    data: {
      email: 'bendahara@kaskita.com',
      password: hashedPassword,
      name: 'Budi (Bendahara)',
      roleId: roleBendahara.id,
      tenantId: tenant.id,
    },
  });

  const hashedRtPassword = await bcrypt.hash('rt123', 10);
  await prisma.user.create({
    data: {
      email: 'rt@kaskita.com',
      password: hashedRtPassword,
      name: 'Pak RT Joko',
      roleId: roleRT.id,
      tenantId: tenant.id,
    },
  });

  const hashedSekPassword = await bcrypt.hash('sekretaris123', 10);
  await prisma.user.create({
    data: {
      email: 'sekretaris@kaskita.com',
      password: hashedSekPassword,
      name: 'Santi (Sekretaris)',
      roleId: roleSekretaris.id,
      tenantId: tenant.id,
    },
  });

  const hashedRwPassword = await bcrypt.hash('rw123', 10);
  await prisma.user.create({
    data: {
      email: 'rw@kaskita.com',
      password: hashedRwPassword,
      name: 'Pak RW Bambang',
      roleId: roleRW.id,
      tenantId: tenant.id,
    },
  });

  const hashedWargaPassword = await bcrypt.hash('warga123', 10);
  await prisma.user.create({
    data: {
      email: 'warga@kaskita.com',
      password: hashedWargaPassword,
      name: 'Rian Warga',
      roleId: roleWarga.id,
      tenantId: tenant.id,
    },
  });
  console.log('Users created.');

  // 6. Create Kas Account
  const kasAccount = await prisma.kasAccount.create({
    data: {
      name: 'Kas Tunai Bendahara',
      balance: 5100000,
      tenantId: tenant.id,
    },
  });
  console.log('Kas Account created.');

  // 7. Create Warga (Residents)
  const warga1 = await prisma.warga.create({
    data: { name: 'Budi Santoso', houseNumber: 'A-12', status: 'sudah_bayar', tenantId: tenant.id },
  });
  const warga2 = await prisma.warga.create({
    data: { name: 'Siti Aminah', houseNumber: 'A-14', status: 'sudah_bayar', tenantId: tenant.id },
  });
  const warga3 = await prisma.warga.create({
    data: { name: 'Joko Widodo', houseNumber: 'B-01', status: 'belum_bayar', tenantId: tenant.id },
  });
  const warga4 = await prisma.warga.create({
    data: { name: 'Dewi Lestari', houseNumber: 'B-02', status: 'menunggak', tenantId: tenant.id },
  });
  const warga5 = await prisma.warga.create({
    data: { name: 'Rian Hidayat', houseNumber: 'C-05', status: 'sudah_bayar', tenantId: tenant.id },
  });
  console.log('Warga records created.');

  // 8. Create Transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: 'pemasukan',
        title: 'Iuran Sampah & Keamanan Blok A',
        amount: 1500000,
        category: 'Iuran Warga',
        date: '2026-05-24',
        kasAccountId: kasAccount.id,
        createdById: bendahara.id,
        tenantId: tenant.id,
      },
      {
        type: 'pengeluaran',
        title: 'Perbaikan Lampu Jalan RT 03',
        amount: 350000,
        category: 'Fasilitas Umum',
        date: '2026-05-22',
        kasAccountId: kasAccount.id,
        createdById: bendahara.id,
        tenantId: tenant.id,
      },
      {
        type: 'pemasukan',
        title: 'Sumbangan Donatur Pembangunan Gapura',
        amount: 5000000,
        category: 'Donasi',
        date: '2026-05-20',
        kasAccountId: kasAccount.id,
        createdById: bendahara.id,
        tenantId: tenant.id,
      },
      {
        type: 'pengeluaran',
        title: 'Gaji Petugas Kebersihan & Keamanan',
        amount: 1200000,
        category: 'Operasional',
        date: '2026-05-18',
        kasAccountId: kasAccount.id,
        createdById: bendahara.id,
        tenantId: tenant.id,
      },
      {
        type: 'pemasukan',
        title: 'Sewa Aula untuk Rapat Warga',
        amount: 500000,
        category: 'Penyewaan',
        date: '2026-05-15',
        kasAccountId: kasAccount.id,
        createdById: bendahara.id,
        tenantId: tenant.id,
      },
    ],
  });

  console.log('Transactions created.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
