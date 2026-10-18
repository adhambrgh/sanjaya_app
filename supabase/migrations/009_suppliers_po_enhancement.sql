-- supabase/migrations/009_suppliers_po_enhancement.sql
-- Jalankan di Supabase SQL Editor SETELAH 008_extend_products.sql
-- Tujuan: Master Supplier + PO workflow (draft→diajukan→dipesan→diterima) + partial receive + retur

-- ============================================================
-- MASTER SUPPLIERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,                       -- SUP-001, SUP-002, dll
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index & RLS
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_admin_all" ON public.suppliers
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE email = auth.jwt()->>'email' AND role = 'admin')
  );

CREATE POLICY "suppliers_read_active" ON public.suppliers
  FOR SELECT TO authenticated USING (is_active = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT ON public.suppliers TO anon;

-- ============================================================
-- EXTEND PURCHASE_ORDERS TABLE
-- ============================================================
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft','diajukan','dipesan','diterima','batal','retur')),
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes text;

-- Index untuk filter status & supplier
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);

-- ============================================================
-- EXTEND PURCHASE_ORDER_ITEMS TABLE (partial receive + retur)
-- ============================================================
ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS received_qty int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returned_qty int DEFAULT 0;

-- ============================================================
-- VIEW: PO Progress (untuk dashboard/admin)
-- ============================================================
CREATE OR REPLACE VIEW public.v_purchase_orders_progress AS
SELECT 
  po.id,
  po.code,
  po.supplier_id,
  s.name as supplier_name,
  s.code as supplier_code,
  po.status,
  po.total,
  po.notes,
  po.created_at,
  po.received_at,
  COALESCE(SUM(poi.qty), 0) as total_ordered,
  COALESCE(SUM(poi.received_qty), 0) as total_received,
  COALESCE(SUM(poi.returned_qty), 0) as total_returned,
  CASE 
    WHEN COALESCE(SUM(poi.qty), 0) = 0 THEN 0
    ELSE ROUND(COALESCE(SUM(poi.received_qty), 0)::numeric / COALESCE(SUM(poi.qty), 0) * 100, 1)
  END as receive_progress_pct
FROM public.purchase_orders po
LEFT JOIN public.suppliers s ON po.supplier_id = s.id
LEFT JOIN public.purchase_order_items poi ON po.id = poi.po_id
GROUP BY po.id, s.name, s.code;

GRANT SELECT ON public.v_purchase_orders_progress TO authenticated;
GRANT SELECT ON public.v_purchase_orders_progress TO anon;

-- ============================================================
-- RPC: PARTIAL RECEIVE PO ITEM
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_po_item_received(p_po_item_id uuid, p_qty int)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
DECLARE
  v_po_id uuid;
  v_product_id uuid;
  v_product_name text;
  v_po_code text;
  v_supplier_name text;
  v_note text;
  v_new_received int;
  v_ordered_qty int;
  v_all_received boolean;
BEGIN
  -- Validasi qty
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'qty_pharus_positif';
  END IF;

  -- Ambil info PO item + PO header + supplier
  SELECT poi.po_id, poi.product_id, poi.qty, poi.received_qty,
         po.code, po.supplier_id
  INTO v_po_id, v_product_id, v_ordered_qty, v_new_received,
       v_po_code, v_supplier_name
  FROM public.purchase_order_items poi
  JOIN public.purchase_orders po ON poi.po_id = po.id
  WHERE poi.id = p_po_item_id;

  IF v_po_id IS NULL THEN
    RAISE EXCEPTION 'po_item_not_found';
  END IF;

  -- Cek apakah melebihi qty ordered
  IF v_new_received + p_qty > v_ordered_qty THEN
    RAISE EXCEPTION 'qty_melebihi_order';
  END IF;

  -- Update received_qty
  UPDATE public.purchase_order_items
  SET received_qty = v_new_received + p_qty
  WHERE id = p_po_item_id;

  -- Apply stock IN
  PERFORM public.apply_stock('in', v_product_id, p_qty);

  -- Catat stock_movements
  SELECT p.name INTO v_product_name FROM public.products p WHERE p.id = v_product_id;
  SELECT s.name INTO v_supplier_name FROM public.suppliers s WHERE s.id = v_supplier_name;
  v_note := COALESCE(v_po_code, 'PO') || ' • ' || COALESCE(v_supplier_name, 'Supplier') || ' (parsial)';
  
  INSERT INTO public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
  VALUES (v_product_id, v_product_name, 'in', p_qty, v_note, 'Admin (PO Parsial)');

  -- Cek apakah semua item PO sudah received full
  SELECT BOOL_AND(poi.received_qty >= poi.qty) INTO v_all_received
  FROM public.purchase_order_items poi
  WHERE poi.po_id = v_po_id;

  IF v_all_received THEN
    UPDATE public.purchase_orders
    SET status = 'diterima', received_at = NOW(), received_by = auth.uid()
    WHERE id = v_po_id;
  ELSIF (SELECT status FROM public.purchase_orders WHERE id = v_po_id) = 'dipesan' THEN
    -- Jika status dipesan tapi parsial, biarkan 'dipesan' atau update ke status parsial
    -- Optional: tambah status 'parsial' jika perlu
    NULL;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.mark_po_item_received(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_po_item_received(uuid, int) TO anon;

-- ============================================================
-- RPC: RETUR PO ITEM
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_po_item_returned(p_po_item_id uuid, p_qty int, p_reason text DEFAULT '')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
DECLARE
  v_po_id uuid;
  v_product_id uuid;
  v_product_name text;
  v_po_code text;
  v_supplier_name text;
  v_note text;
  v_new_returned int;
  v_received_qty int;
BEGIN
  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'qty_pharus_positif';
  END IF;

  SELECT poi.po_id, poi.product_id, poi.received_qty, poi.returned_qty,
         po.code, po.supplier_id
  INTO v_po_id, v_product_id, v_received_qty, v_new_returned,
       v_po_code, v_supplier_name
  FROM public.purchase_order_items poi
  JOIN public.purchase_orders po ON poi.po_id = po.id
  WHERE poi.id = p_po_item_id;

  IF v_po_id IS NULL THEN
    RAISE EXCEPTION 'po_item_not_found';
  END IF;

  -- Cek apakah melebihi qty yang sudah diterima
  IF v_new_returned + p_qty > v_received_qty THEN
    RAISE EXCEPTION 'qty_melebihi_diterima';
  END IF;

  -- Update returned_qty
  UPDATE public.purchase_order_items
  SET returned_qty = v_new_returned + p_qty
  WHERE id = p_po_item_id;

  -- Apply stock OUT (karena retur = keluar dari gudang)
  PERFORM public.apply_stock('out', v_product_id, p_qty);

  -- Catat stock_movements
  SELECT p.name INTO v_product_name FROM public.products p WHERE p.id = v_product_id;
  SELECT s.name INTO v_supplier_name FROM public.suppliers s WHERE s.id = v_supplier_name;
  v_note := 'Retur ' || COALESCE(v_po_code, 'PO') || ' • ' || COALESCE(v_supplier_name, 'Supplier');
  IF p_reason <> '' THEN
    v_note := v_note || ' - ' || p_reason;
  END IF;
  
  INSERT INTO public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
  VALUES (v_product_id, v_product_name, 'out', p_qty, v_note, 'Admin (Retur PO)');

  -- Jika semua item diretur full, update status PO
  IF (SELECT BOOL_AND(poi.returned_qty >= poi.received_qty) 
      FROM public.purchase_order_items poi WHERE poi.po_id = v_po_id) THEN
    UPDATE public.purchase_orders
    SET status = 'retur'
    WHERE id = v_po_id;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.mark_po_item_returned(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_po_item_returned(uuid, int, text) TO anon;

-- ============================================================
-- RPC: UPDATE PO STATUS (manual workflow)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_po_status(p_po_id uuid, p_status text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
BEGIN
  IF p_status NOT IN ('draft','diajukan','dipesan','diterima','batal','retur') THEN
    RAISE EXCEPTION 'status_tidak_valid';
  END IF;
  
  UPDATE public.purchase_orders
  SET status = p_status
  WHERE id = p_po_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'po_not_found';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.update_po_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_po_status(uuid, text) TO anon;