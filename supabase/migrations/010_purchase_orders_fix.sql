-- supabase/migrations/010_purchase_orders_fix.sql
-- Jalankan di Supabase SQL Editor SETELAH 009_suppliers_po_enhancement.sql
--
-- Tujuan: memperbaiki penyebab "Simpan PO tidak tersimpan":
-- 1. CHECK constraint pada purchase_orders.status masih memakai nilai lama
--    (era 'received'/'pending') sehingga menolak nilai workflow baru ('draft').
--    Ini terjadi karena 009 memakai "ADD COLUMN IF NOT EXISTS status ... CHECK(...)",
--    dan klausa CHECK dilewati ketika kolom status sudah lebih dulu ada.
-- 2. Memastikan policy RLS admin untuk purchase_orders & purchase_order_items.
-- 3. Menyamakan RPC mark_po_received agar menulis status 'diterima'
--    (sebelumnya 'received') sesuai workflow di aplikasi.
--
-- Aman dijalankan berulang.

-- ============================================================
-- 1. PASTIKAN KOLOM LENGKAP (jaga-jaga bila 009 belum dijalankan)
-- ============================================================
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS received_qty int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returned_qty int DEFAULT 0;

-- ============================================================
-- 2. GANTI CHECK CONSTRAINT status PADA purchase_orders
-- ============================================================
-- Hapus semua CHECK constraint yang menyentuh kolom status (nama bisa apa saja)
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.purchase_orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.purchase_orders DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

-- Tambah ulang constraint yang benar (hanya nilai workflow PO yang dipakai aplikasi)
ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('draft','diajukan','dipesan','diterima','batal','retur'));

-- ============================================================
-- 3. ROW LEVEL SECURITY: admin akses penuh (pola sama seperti 20260101_documents_admin.sql)
-- ============================================================
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_orders admin all" ON public.purchase_orders;
CREATE POLICY "purchase_orders admin all" ON public.purchase_orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_order_items admin all" ON public.purchase_order_items;
CREATE POLICY "purchase_order_items admin all" ON public.purchase_order_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 4. RPC mark_po_received: pakai status 'diterima' (selaras dengan aplikasi)
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_po_received(p_po_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_code text;
  v_supplier text;
  v_note text;
BEGIN
  SELECT code, supplier
  INTO v_code, v_supplier
  FROM public.purchase_orders
  WHERE id = p_po_id;

  -- contoh catatan: "PO-123456 • PT Astra"
  v_note := coalesce(v_code, 'PO') || coalesce(nullif(' • ' || v_supplier, ''), '');

  UPDATE public.purchase_orders
  SET status = 'diterima',
      received_at = now(),
      received_by = auth.uid()
  WHERE id = p_po_id;

  FOR v_item IN
    SELECT product_id, qty FROM public.purchase_order_items WHERE po_id = p_po_id
  LOOP
    PERFORM public.apply_stock('in', v_item.product_id, v_item.qty);
    INSERT INTO public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
    SELECT v_item.product_id, p.name, 'in', v_item.qty, v_note, 'Admin (PO)'
    FROM public.products p WHERE p.id = v_item.product_id;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.mark_po_received(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_po_received(uuid) TO anon;
