import { Module } from '@nestjs/common';
import { WargaController } from './warga.controller';
import { WargaService } from './warga.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [WargaController],
  providers: [WargaService],
  exports: [WargaService],
})
export class WargaModule {}
