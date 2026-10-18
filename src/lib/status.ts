// ===== STATUS MAPPING (terpusat untuk seluruh aplikasi) =====

// Daftar lengkap status yang dipakai di:
// - Order (pending, paid, failed, cancelled)
// - Purchase Order (draft, diajukan, dipesan, diterima, batal, retur)
// - Stock Movement (in, out)
export type AnyStatus =
  // Order status
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  // Purchase Order status
  | 'draft'
  | 'diajukan'
  | 'dipesan'
  | 'diterima'
  | 'batal'
  | 'retur';

// Label Indonesia untuk setiap status (dipakai di badge/list UI)
export const STATUS_LABEL: Record<AnyStatus, string> = {
  pending: 'Pending',
  paid: 'Lunas',
  failed: 'Gagal',
  cancelled: 'Batal',
  draft: 'Draft',
  diajukan: 'Diajukan',
  dipesan: 'Dipesan',
  diterima: 'Diterima',
  batal: 'Dibatalkan',
  retur: 'Retur',
};

// Helper: ambil label Indonesia, fallback ke status asli jika tidak dikenal
export const statusLabel = (s: string): string =>
  STATUS_LABEL[s as AnyStatus] ?? s;

// Tipe tone untuk badge style (dipakai di StyleSheet.create)
export type StatusTone =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'draft'
  | 'warning'
  | 'active'
  | 'danger'
  | 'retur';

// Pemetaan status → tone (untuk styling badge konsisten)
export const STATUS_TONE: Record<AnyStatus, StatusTone> = {
  pending: 'pending',
  paid: 'success',
  failed: 'failed',
  cancelled: 'cancelled',
  draft: 'draft',
  diajukan: 'warning',
  dipesan: 'active',
  diterima: 'success',
  batal: 'danger',
  retur: 'retur',
};

// Helper: ambil tone untuk status
export const statusTone = (s: string): StatusTone =>
  STATUS_TONE[s as AnyStatus] ?? 'pending';
