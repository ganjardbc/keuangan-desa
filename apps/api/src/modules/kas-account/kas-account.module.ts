import { Module } from '@nestjs/common';
import { KasAccountService } from './kas-account.service';
import { KasAccountController } from './kas-account.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KasAccountController],
  providers: [KasAccountService],
  exports: [KasAccountService],
})
export class KasAccountModule {}
