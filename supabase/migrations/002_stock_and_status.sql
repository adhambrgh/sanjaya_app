-- supabase/migrations/002_stock_and_status.sql
-- Jalankan di Supabase SQL Editor SETELAH schema.sql awal

-- ============================================================
-- ATOMIC STOCK FUNCTION
-- ============================================================
create or replace function public.apply_stock(p_mov_type text, p_id uuid, p_qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mov_type = 'out' then
    update public.products
    set stock = stock - p_qty
    where id = p_id and stock >= p_qty;
    if not found then
      raise exception 'stok_kurang';
    end if;
  elsif p_mov_type = 'in' then
    update public.products
    set stock = stock + p_qty
    where id = p_id;
  end if;
end $$;

grant execute on function public.apply_stock(text, uuid, int) to authenticated;
grant execute on function public.apply_stock(text, uuid, int) to anon;

-- ============================================================
-- CREATE ORDER WITH ATOMIC STOCK DECREMENT
-- ============================================================
create or replace function public.create_order_with_items(
  p_code text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_pid uuid;
  v_qty int;
begin
  -- Insert order
  insert into public.orders (user_id, code, status, total)
  select auth.uid(), p_code, 'pending',
         sum((item->>'price')::int * (item->>'qty')::int)
  from jsonb_array_elements(p_items) item
  returning id into v_order_id;

  -- Loop items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    insert into public.order_items (order_id, product_id, name, qty, price)
    values (v_order_id, v_pid, v_item->>'name', v_qty, (v_item->>'price')::int);

    -- Atomic stock decrement
    perform public.apply_stock('out', v_pid, v_qty);
  end loop;

  return v_order_id;
exception
  when sqlstate 'P0001' then
    raise exception 'stok_kurang';
  when others then
    raise;
end $$;

-- ============================================================
-- PO RECEIVED -> STOCK IN
-- ============================================================
create or replace function public.mark_po_received(p_po_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  update public.purchase_orders
  set status = 'received'
  where id = p_po_id;

  for v_item in
    select product_id, qty from public.purchase_order_items where po_id = p_po_id
  loop
    perform public.apply_stock('in', v_item.product_id, v_item.qty);
    insert into public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
    select v_item.product_id, p.name, 'in', v_item.qty, 'PO diterima', 'Admin (PO)'
    from public.products p where p.id = v_item.product_id;
  end loop;
end $$;

-- ============================================================
-- ORDERS STATUS (extend check)
-- ============================================================
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
check (status in ('pending','paid','failed','cancelled'));

-- ============================================================
-- HELPER: UPDATE ORDER STATUS (for webhook/manual)
-- ============================================================
create or replace function public.update_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text;
begin
  select o.status into v_prev from public.orders o where o.id = p_order_id;
  if v_prev is null then
    raise exception 'order_not_found';
  end if;
  if v_prev = p_status then
    return; -- idempotent
  end if;

  update public.orders set status = p_status where id = p_order_id;

  -- hanya restock kalau transisi dari 'pending' ke failed/cancelled (sekali saja)
  if v_prev = 'pending' and p_status in ('failed','cancelled') then
    insert into public.stock_movements (product_id, product_name, movement_type, qty, note, admin_name)
    select oi.product_id, oi.name, 'in', oi.qty, 'Order ' || p_status, 'System (Webhook)'
    from public.order_items oi where oi.order_id = p_order_id;
    update public.products p
    set stock = p.stock + oi.qty
    from public.order_items oi
    where oi.order_id = p_order_id and p.id = oi.product_id;
  end if;
end $$;

-- ============================================================
-- GRANTS: izinkan role authenticated memanggil RPC
-- (security definer tetap jalan dengan hak pemilik fungsi)
-- ============================================================
grant execute on function public.apply_stock(text, uuid, int) to authenticated;
grant execute on function public.create_order_with_items(text, jsonb) to authenticated;
grant execute on function public.mark_po_received(uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text) to authenticated;