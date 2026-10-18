-- supabase/migrations/012_po_receive_stock_flow.sql
-- Tujuan: saat PO diubah statusnya menjadi 'diterima' via update_po_status,
--         stok produk otomatis bertambah DAN tercatat di stock_movements
--         sehingga muncul di menu "Aliran Barang".
--
-- Latar belakang: sebelumnya RPC update_po_status hanya mengubah kolom status
-- tanpa apply_stock / insert stock_movements, sehingga tombol "Terima Semua"
-- di halaman PO tidak menambah stok maupun mencatat aliran barang.
--
-- Jalankan SETELAH 009_suppliers_po_enhancement.sql dan 011_stock_movements_rls.sql.

CREATE OR REPLACE FUNCTION public.update_po_status(p_po_id uuid, p_status text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_item record;
  v_code text;
  v_supplier text;
  v_note text;
BEGIN
  -- validasi status yang diizinkan
  IF p_status NOT IN ('draft','diajukan','dipesan','diterima','batal','retur') THEN
    RAISE EXCEPTION 'status_tidak_valid';
  END IF;

  -- lock baris PO + ambil status lama untuk mencegah proses stok ganda
  -- nama supplier diambil dari tabel suppliers via supplier_id (bukan kolom teks)
  SELECT po.status, po.code, s.name
    INTO v_old_status, v_code, v_supplier
  FROM public.purchase_orders po
  LEFT JOIN public.suppliers s ON s.id = po.supplier_id
  WHERE po.id = p_po_id
  FOR UPDATE OF po;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'po_not_found';
  END IF;

  -- HANYA saat transisi "belum diterima -> diterima" jalankan penambahan stok
  IF p_status = 'diterima' AND v_old_status IS DISTINCT FROM 'diterima' THEN
    -- catatan aliran: "PO-XXXX • Nama Supplier"
    v_note := coalesce(v_code, 'PO') || coalesce(nullif(' • ' || v_supplier, ''), '');

    FOR v_item IN
      SELECT product_id, qty
      FROM public.purchase_order_items
      WHERE po_id = p_po_id
    LOOP
      -- tambah stok produk (atomic)
      PERFORM public.apply_stock('in', v_item.product_id, v_item.qty);

      -- catat pergerakan stok masuk (muncul di Aliran Barang)
      INSERT INTO public.stock_movements
        (product_id, product_name, movement_type, qty, note, admin_name)
      SELECT v_item.product_id, p.name, 'in', v_item.qty, v_note, 'Admin (PO)'
      FROM public.products p
      WHERE p.id = v_item.product_id;
    END LOOP;

    -- sinkronkan progress penerimaan menjadi penuh
    UPDATE public.purchase_order_items
       SET received_qty = qty
     WHERE po_id = p_po_id;

    -- tandai waktu & admin penerima
    UPDATE public.purchase_orders
       SET received_at = now(),
           received_by = auth.uid()
     WHERE id = p_po_id;
  END IF;

  -- update status PO
  UPDATE public.purchase_orders
     SET status = p_status
   WHERE id = p_po_id;
END $$;

GRANT EXECUTE ON FUNCTION public.update_po_status(uuid, text) TO authenticated;
