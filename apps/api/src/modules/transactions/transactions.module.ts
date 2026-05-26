import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PublicController } from './public.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [TransactionsController, PublicController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
