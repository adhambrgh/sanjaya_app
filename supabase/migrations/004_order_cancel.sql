-- supabase/migrations/004_order_cancel.sql
-- Jalankan di Supabase SQL Editor SETELAH schema.sql awal, 002, dan 003

-- ============================================================
-- CANCEL ORDER (oleh pemilik pesanan)
-- Menandai order sebagai 'cancelled' dan mengembalikan stok.
-- Hanya pemilik order (auth.uid() = user_id) yang boleh membatalkan.
-- ============================================================
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- pastikan pesanan ada dan milik user yang sedang login
  if not exists (
    select 1 from public.orders
    where id = p_order_id and user_id = auth.uid()
  ) then
    raise exception 'not_owner';
  end if;

  -- ubah status via helper: restock otomatis saat pending -> cancelled
  perform public.update_order_status(p_order_id, 'cancelled');
end $$;

grant execute on function public.cancel_order(uuid) to authenticated;
