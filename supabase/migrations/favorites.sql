-- Jalankan di Supabase Dashboard > SQL Editor
-- Tabel favorit per user: satu baris = satu produk yang difavoritkan oleh seorang user.
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  -- satu user hanya boleh memfavoritkan produk yang sama sekali
  unique (user_id, product_id)
);

alter table public.favorites enable row level security;

-- user hanya bisa membaca favorit miliknya sendiri
drop policy if exists "favorites select own" on public.favorites;
create policy "favorites select own" on public.favorites
  for select using (auth.uid() = user_id);

-- user hanya boleh menambah favorit untuk dirinya sendiri
drop policy if exists "favorites insert own" on public.favorites;
create policy "favorites insert own" on public.favorites
  for insert with check (auth.uid() = user_id);

-- user hanya bisa menghapus favorit miliknya sendiri
drop policy if exists "favorites delete own" on public.favorites;
create policy "favorites delete own" on public.favorites
  for delete using (auth.uid() = user_id);
