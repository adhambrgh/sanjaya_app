-- supabase/migrations/20260101_documents_admin.sql
-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan berulang)
--
-- Tujuan: memastikan admin punya akses penuh (baca/tambah/edit/hapus)
-- ke tabel documents. Tanpa ini, tombol Edit & Hapus di menu Dokumen Gudang
-- bisa ditolak oleh Row Level Security.

alter table public.documents enable row level security;

-- Admin full access (fungsi is_admin() sudah tersedia dari migrasi lain)
drop policy if exists "documents admin all" on public.documents;
create policy "documents admin all" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());
