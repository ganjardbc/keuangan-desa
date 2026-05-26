import { Module } from '@nestjs/common';
import { JenisIuranController } from './jenis-iuran.controller';
import { JenisIuranService } from './jenis-iuran.service';

@Module({
  controllers: [JenisIuranController],
  providers: [JenisIuranService],
  exports: [JenisIuranService],
})
export class JenisIuranModule {}
