-- Jalankan di Supabase Dashboard > SQL Editor
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (product_id, user_id)
);

alter table public.reviews enable row level security;

drop policy if exists "reviews read all" on public.reviews;
create policy "reviews read all" on public.reviews
  for select using (true);

create or replace function public.can_review(p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = auth.uid()
      and oi.product_id = p_product
      and o.status = 'paid'
  );
$$;

drop policy if exists "reviews insert verified" on public.reviews;
create policy "reviews insert verified" on public.reviews
  for insert with check (auth.uid() = user_id and public.can_review(product_id));

drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews delete own" on public.reviews;
create policy "reviews delete own" on public.reviews
  for delete using (auth.uid() = user_id);
