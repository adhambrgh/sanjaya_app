-- supabase/migrations/008_extend_products.sql
-- Jalankan di Supabase SQL Editor SETELAH migrasi sebelumnya
-- Tujuan: Tambah kolom detail produk untuk master data UMKM

-- ============================================================
-- EXTEND PRODUCTS TABLE
-- ============================================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs',                    -- satuan: pcs, box, liter, roll, set, unit
  ADD COLUMN IF NOT EXISTS purchase_price int DEFAULT 0,               -- harga beli / modal per unit
  ADD COLUMN IF NOT EXISTS location text DEFAULT 'Gudang Utama',       -- lokasi penyimpanan
  ADD COLUMN IF NOT EXISTS initial_stock int DEFAULT 0;                -- stok awal (referensi saat create)

-- Index untuk filter lokasi & satuan
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_products_unit ON public.products(unit);

-- Comment kolom untuk dokumentasi
COMMENT ON COLUMN public.products.unit IS 'Satuan produk: pcs, box, liter, roll, set, unit, dll';
COMMENT ON COLUMN public.products.purchase_price IS 'Harga beli / modal per unit (Rupiah)';
COMMENT ON COLUMN public.products.location IS 'Lokasi penyimpanan fisik: Gudang Utama, Gudang B, Showroom, dll';
COMMENT ON COLUMN public.products.initial_stock IS 'Stok awal saat produk pertama kali didaftarkan (referensi)';

-- ============================================================
-- GRANTS (pastikan role anon/authenticated bisa read/write)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;