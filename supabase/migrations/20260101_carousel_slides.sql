-- supabase/migrations/20260101_carousel_slides.sql
-- Jalankan di Supabase Dashboard > SQL Editor

create table public.carousel_slides (
  id uuid primary key default gen_random_uuid(),
  badge text,
  title text not null,
  subtitle text,
  icon text,
  image_url text,
  action_type text not null default 'shop',
  action_value text,
  button_label text not null default 'Lihat',
  "order" int default 99,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.carousel_slides enable row level security;

-- Public read (untuk shop/user)
create policy "carousel_slides read active" on public.carousel_slides
  for select using (is_active = true);

-- Admin full access (menggunakan fungsi is_admin() yang sudah ada)
create policy "carousel_slides admin all" on public.carousel_slides
  for all using (public.is_admin());

-- Seed data (3 slide dari SLIDES lama)
insert into public.carousel_slides (badge, title, subtitle, icon, action_type, action_value, button_label, "order", is_active) values
  ('SANJAYABERKAH', 'Potongan Rp 10rb\ntiap belanja part!', 'pakai sekarang', 'build', 'coupon', 'SANJAYABERKAH', 'Pakai Kupon', 1, true),
  ('SERVIS BERKALA', 'Ganti oli & tune up\npasang gratis semua', 'bengkel siap', 'construct', 'shop', null, 'Belanja', 2, true),
  ('GARANSI 30 HARI', 'Part asli 100%\nklaim garansi mudah', 'tenang dipakai', 'shield', 'products', null, 'Lihat Produk', 3, true);