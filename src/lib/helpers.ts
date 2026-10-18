// ===== HELPER FUNCTIONS (terpusat untuk seluruh aplikasi) =====

import type { Product } from '../models';

// Parse string ke integer (0 jika tidak valid)
// Dipakai untuk input qty/harga di PO & form lainnya
export const toInt = (s: string): number => {
  const n = Math.trunc(Number(s));
  return isNaN(n) ? 0 : n;
};

// Ambil nama kategori produk, fallback 'Lainnya' jika kosong
export const catOf = (p: Product): string => p.category || 'Lainnya';

// Convert slug to Title Case label (oli-dan-pelumas → Oli Dan Pelumas)
export function slugToLabel(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
