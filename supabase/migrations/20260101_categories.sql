-- supabase/migrations/20260101_categories.sql
-- Jalankan di Supabase Dashboard > SQL Editor

create table public.categories (
  id text primary key,
  label text not null,
  icon text not null,
  "order" int default 99,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.categories enable row level security;

-- Public read (untuk shop/user)
create policy "categories read all" on public.categories
  for select using (is_active = true);

-- Admin full access (menggunakan fungsi is_admin() yang sudah ada)
create policy "categories admin all" on public.categories
  for all using (public.is_admin());

-- Seed data
insert into public.categories (id, label, icon, "order", is_active) values
  ('oli-pelumas', 'Oli & Pelumas', 'water', 1, true),
  ('pengereman', 'Pengereman', 'disc', 2, true),
  ('pengapian', 'Pengapian', 'flash', 3, true),
  ('pendingin', 'Pendingin', 'snow', 4, true),
  ('cvtr', 'CVT', 'cog', 5, true),
  ('roda-ban', 'Roda & Ban', 'ellipse', 6, true),
  ('kelistrikan', 'Kelistrikan', 'battery-full', 7, true),
  ('listrik', 'Listrik', 'flash', 8, true);