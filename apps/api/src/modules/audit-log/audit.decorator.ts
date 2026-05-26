import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';

/**
 * Decorator that marks a controller handler for automatic audit logging.
 * The interceptor `AuditInterceptor` reads this metadata after the handler
 * completes successfully and writes an entry to the AuditLog table.
 *
 * @param action - Short action identifier string (e.g., 'TAMBAH_WARGA', 'HAPUS_TRANSAKSI')
 *
 * @example
 * @Post()
 * @Audit('TAMBAH_WARGA')
 * async create(@Body() body: any) { ... }
 */
export const Audit = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
