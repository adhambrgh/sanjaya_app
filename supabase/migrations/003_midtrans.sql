-- supabase/migrations/003_midtrans.sql
-- Jalankan di Supabase SQL Editor SETELAH schema.sql awal dan 002_stock_and_status.sql

-- ============================================================
-- KOLOM DISCOUNT PADA ORDERS
-- (agar gross_amount Midtrans sesuai dengan total yang dibayar user setelah kupon)
-- ============================================================
alter table public.orders
  add column if not exists discount integer not null default 0;

-- ============================================================
-- CREATE ORDER DENGAN DISCOUNT
-- total = sum(price*qty) - discount (dipastikan minimal 0)
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
  -- Hitung subtotal dari item
  select sum((item->>'price')::int * (item->>'qty')::int)
  into v_total
  from jsonb_array_elements(p_items) item;

  -- Insert order dengan total setelah diskon
  insert into public.orders (user_id, code, status, total, discount)
  values (auth.uid(), p_code, 'pending', greatest(0, v_total - coalesce(p_discount, 0)), coalesce(p_discount, 0))
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

grant execute on function public.create_order_with_items(text, jsonb, int) to authenticated;