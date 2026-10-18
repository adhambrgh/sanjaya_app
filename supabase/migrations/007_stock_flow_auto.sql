-- supabase/migrations/007_stock_flow_auto.sql
-- Jalankan di Supabase SQL Editor SETELAH 002_stock_and_status.sql, 003_midtrans.sql, 004_order_cancel.sql
--
-- Tujuan: setiap pembelian (PO) dan penjualan (order) otomatis tercatat
-- ke tabel stock_movements, sehingga muncul di menu "Aliran Barang".

-- ============================================================
-- PO DITERIMA -> catatan aliran pakai kode PO + supplier
-- ============================================================
create or replace function public.mark_po_received(p_po_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_code text;
  v_supplier text;
  v_note text;
begin
  select code, supplier
  into v_code, v_supplier
  from public.purchase_orders
  where id = p_po_id;

  -- contoh catatan: "PO-123456 • PT Astra"
  v_note := coalesce(v_code, 'PO') || coalesce(nullif(' • ' || v_supplier, ''), '');

  update public.purchase_orders
  set status = 'received'
  where id = p_po_id;

  for v_item in
    select product_id, qty from public.purchase_order_items where po_id = p_po_id
  loop
    perform public.apply_stock('in', v_item.product_id, v_item.qty);
    insert into public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
    select v_item.product_id, p.name, 'in', v_item.qty, v_note, 'Admin (PO)'
    from public.products p where p.id = v_item.product_id;
  end loop;
end $$;

-- ============================================================
-- PENJUALAN -> catat aliran 'out' (catatan = kode order)
-- (versi 003_midtrans + insert stock_movements)
-- ============================================================
create or replace function public.create_order_with_items(
  p_code text,
  p_items jsonb,
  p_discount int default 0
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total int;
  v_item jsonb;
  v_pid uuid;
  v_qty int;
begin
  -- subtotal dari item
  select sum((item->>'price')::int * (item->>'qty')::int)
  into v_total
  from jsonb_array_elements(p_items) item;

  -- insert order (total setelah diskon)
  insert into public.orders (user_id, code, status, total, discount)
  values (auth.uid(), p_code, 'pending',
          greatest(0, v_total - coalesce(p_discount, 0)), coalesce(p_discount, 0))
  returning id into v_order_id;

  -- loop item: simpan detail, kurangi stok, catat aliran keluar
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    insert into public.order_items (order_id, product_id, name, qty, price)
    values (v_order_id, v_pid, v_item->>'name', v_qty, (v_item->>'price')::int);

    -- atomic stock decrement
    perform public.apply_stock('out', v_pid, v_qty);

    -- catat pergerakan stok keluar (aliran barang)
    insert into public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
    values (v_pid, v_item->>'name', 'out', v_qty, p_code, 'Sistem (Order)');
  end loop;

  return v_order_id;
exception
  when sqlstate 'P0001' then
    raise exception 'stok_kurang';
  when others then
    raise;
end $$;

-- ============================================================
-- GRANTS
-- ============================================================
grant execute on function public.mark_po_received(uuid) to authenticated;
grant execute on function public.create_order_with_items(text, jsonb, int) to authenticated;
