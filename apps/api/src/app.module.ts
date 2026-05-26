import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WargaModule } from './modules/warga/warga.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JenisIuranModule } from './modules/jenis-iuran/jenis-iuran.module';
import { KasAccountModule } from './modules/kas-account/kas-account.module';
import { ProyekKegiatanModule } from './modules/proyek-kegiatan/proyek-kegiatan.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AdminModule } from './modules/admin/admin.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WargaModule,
    TransactionsModule,
    JenisIuranModule,
    KasAccountModule,
    ProyekKegiatanModule,
    AuditLogModule,
    AdminModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
