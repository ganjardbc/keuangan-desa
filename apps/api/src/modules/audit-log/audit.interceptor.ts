import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';
import { AUDIT_ACTION_KEY } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    // If no @Audit() decorator is present, skip silently
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress =
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      'unknown';

    return next.handle().pipe(
      tap((responseData) => {
        if (!user?.id) return;

        // Build a meaningful details string from the response
        const details = buildDetails(action, responseData, request.body);

        // Fire-and-forget — do not await to avoid blocking the response
        void this.auditLogService.log(
          user.id,
          action,
          details,
          String(ipAddress),
        );
      }),
    );
  }
}

/**
 * Constructs a human-readable details string based on the action type
 * and the data returned from the handler.
 */
function buildDetails(action: string, data: any, body: any): string {
  const name = data?.name ?? data?.title ?? body?.name ?? body?.title ?? '';

  const detailsMap: Record<string, string> = {
    TAMBAH_WARGA: `Menambah warga baru: ${name} (No. ${data?.houseNumber ?? body?.houseNumber ?? '-'})`,
    UBAH_WARGA: `Memperbarui data warga ID: ${data?.id ?? '-'}`,
    HAPUS_WARGA: `Menghapus warga ID: ${data?.id ?? '-'}`,
    CATAT_PEMBAYARAN: `Mencatat pembayaran iuran warga ID: ${data?.wargaId ?? '-'}, bulan ${data?.month ?? '-'}/${data?.year ?? '-'}`,
    CATAT_PEMBAYARAN_BULK: `Mencatat pembayaran iuran massal warga ID: ${data?.[0]?.wargaId ?? '-'} (${data?.length ?? 0} iuran)`,
    CATAT_PEMBAYARAN_BULK_ALL: `Mencatat pembayaran iuran cepat semua warga (${data?.length ?? 0} iuran)`,
    TAMBAH_TRANSAKSI: `Menambah transaksi: ${name} sebesar Rp ${data?.amount?.toLocaleString('id-ID') ?? '-'}`,
    HAPUS_TRANSAKSI: `Menghapus transaksi ID: ${data?.id ?? '-'}`,
    TAMBAH_KAS: `Menambah akun kas: ${name}`,
    UBAH_KAS: `Memperbarui akun kas: ${name}`,
    HAPUS_KAS: `Menghapus akun kas ID: ${data?.id ?? '-'}`,
    TAMBAH_PROYEK: `Menambah proyek kegiatan: ${name}`,
    UBAH_PROYEK: `Memperbarui proyek: ${name}`,
    HAPUS_PROYEK: `Menghapus proyek ID: ${data?.id ?? '-'}`,
    TAMBAH_JENIS_IURAN: `Menambah jenis iuran: ${name}`,
    HAPUS_JENIS_IURAN: `Menghapus jenis iuran ID: ${data?.id ?? '-'}`,
  };

  return detailsMap[action] ?? `Aksi ${action} berhasil dieksekusi`;
}
