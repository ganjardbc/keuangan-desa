import { Module } from '@nestjs/common';
import { ProyekKegiatanService } from './proyek-kegiatan.service';
import { ProyekKegiatanController } from './proyek-kegiatan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProyekKegiatanController],
  providers: [ProyekKegiatanService],
  exports: [ProyekKegiatanService],
})
export class ProyekKegiatanModule {}
