-- supabase/migrations/006_customer_addresses.sql
-- Tabel alamat & kendaraan milik pelanggan.
-- Jalankan di Supabase SETELAH migrasi 005.

-- ============================================================
-- TABEL customer_addresses
-- kind = 'address' (alamat pengiriman) atau 'vehicle' (kendaraan pelanggan)
-- satu tabel dipakai dua-duanya agar sederhana; kolom yang tidak relevan null
-- ============================================================
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'address' check (kind in ('address', 'vehicle')),
  -- label singkat, mis. 'Rumah', 'Kantor', 'Motor utama'
  label text,
  -- nama penerima (alamat) / nama pemilik (kendaraan)
  name text,
  -- nomor telepon/HP
  phone text,
  -- detail alamat lengkap (untuk kind='address')
  address text,
  -- data kendaraan (untuk kind='vehicle')
  vehicle_type text,   -- mis. Matic / Bebek / Sport
  vehicle_model text,  -- mis. Honda Beat FI 2019
  plate text,          -- nomor polisi, mis. D 1234 ABC
  -- penanda alamat utama
  is_default boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customer_addresses_user_id_idx on public.customer_addresses(user_id);

-- ============================================================
-- ROW LEVEL SECURITY: user hanya boleh akses barisnya sendiri
-- ============================================================
alter table public.customer_addresses enable row level security;

drop policy if exists "customer_addresses select own" on public.customer_addresses;
create policy "customer_addresses select own" on public.customer_addresses
  for select using (auth.uid() = user_id);

drop policy if exists "customer_addresses insert own" on public.customer_addresses;
create policy "customer_addresses insert own" on public.customer_addresses
  for insert with check (auth.uid() = user_id);

drop policy if exists "customer_addresses update own" on public.customer_addresses;
create policy "customer_addresses update own" on public.customer_addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "customer_addresses delete own" on public.customer_addresses;
create policy "customer_addresses delete own" on public.customer_addresses
  for delete using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: perbarui kolom updated_at otomatis setiap update
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_customer_addresses_touch on public.customer_addresses;
create trigger trg_customer_addresses_touch
  before update on public.customer_addresses
  for each row execute function public.touch_updated_at();
