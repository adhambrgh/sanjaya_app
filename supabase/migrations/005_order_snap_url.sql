-- supabase/migrations/005_order_snap_url.sql
-- Menyimpan URL halaman pembayaran Midtrans Snap per order.
-- Dipakai agar pelanggan bisa membuka kembali halaman pembayaran pesanan yang masih menunggu (pending).

alter table public.orders
  add column if not exists snap_url text;
