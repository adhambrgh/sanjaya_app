// ===== IMPORT (mengambil library yang dibutuhkan) =====

// React + hook: createContext (konteks global), useContext (pakai konteks),
// useState (state lokal), useCallback (fungsi stabil), useEffect (efek samping)
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
// klien Supabase untuk mendeteksi perubahan login/logout (agar favorit dimuat per user)
import { supabase } from '../lib/supabase';
// fungsi repo favorit: ambil id, tambah, dan hapus favorit
import { getFavoriteIds, addFavorite, removeFavorite } from '../repo';

// ===== TYPE (bentuk konteks favorit) =====

// nilai & aksi yang dibagikan ke seluruh komponen
type FavoritesCtx = {
  // daftar id produk favorit user yang sedang login
  ids: string[];
  // jumlah produk favorit (untuk badge bila perlu)
  count: number;
  // cek apakah sebuah produk sudah difavoritkan
  isFav: (id: string) => boolean;
  // tambah/hapus favorit (toggle) secara optimistis
  toggle: (id: string) => Promise<void>;
  // muat ulang daftar favorit dari server
  reload: () => Promise<void>;
};

// ===== KONTEKS =====

// konteks favorit; nilai awal null dan wajib dipakai di dalam FavoritesProvider
const Ctx = createContext<FavoritesCtx | null>(null);

// ===== PROVIDER =====

// komponen penyedia konteks favorit
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  // state daftar id produk favorit
  const [ids, setIds] = useState<string[]>([]);

  // reload: ambil ulang daftar id favorit dari server (dipakai juga oleh layar Favorit)
  const reload = useCallback(async () => {
    const rows = await getFavoriteIds();
    setIds(rows);
  }, []);

  // muat favorit saat pertama kali mount, dan setiap kali status login berubah.
  // catatan: pengambilan dijadwalkan async (setTimeout/promise) agar setState tidak
  // dipanggil sinkron di dalam effect (menghindari re-render berantai).
  useEffect(() => {
    // flag 'active' mencegah setState setelah komponen dilepas
    let active = true;
    // helper: ambil id favorit lalu simpan bila komponen masih aktif
    const loadIds = () =>
      getFavoriteIds().then((rows) => { if (active) setIds(rows); });
    // muat sekali di awal (dijadwalkan, bukan sinkron)
    const t = setTimeout(loadIds, 0);
    // berlangganan perubahan auth; saat login/logout, muat ulang favorit
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // jeda singkat agar sesi baru siap sebelum query dijalankan
      setTimeout(loadIds, 0);
    });
    // bersihkan timer & langganan saat komponen dilepas
    return () => { active = false; clearTimeout(t); subscription.unsubscribe(); };
  }, []);

  // isFav: cek keanggotaan id pada daftar favorit
  const isFav = useCallback((id: string) => ids.includes(id), [ids]);

  // toggle: tambah bila belum favorit, hapus bila sudah; pembaruan optimistis
  const toggle = useCallback(async (id: string) => {
    // status sekarang
    const on = ids.includes(id);
    // ubah tampilan dulu agar ikon hati langsung merespons
    setIds((prev) => (on ? prev.filter((x) => x !== id) : [...prev, id]));
    // kirim ke server; hasil menunjukkan berhasil/tidak
    const ok = on ? await removeFavorite(id) : await addFavorite(id);
    // bila gagal (mis. belum login / tabel belum ada), kembalikan ke keadaan semula
    if (!ok) setIds((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
  }, [ids]);

  // jumlah favorit
  const count = ids.length;

  // sediakan nilai konteks ke komponen anak
  return (
    <Ctx.Provider value={{ ids, count, isFav, toggle, reload }}>
      {children}
    </Ctx.Provider>
  );
}

// ===== HOOK PENGGUNA KONTEKS =====

// hook untuk mengakses konteks favorit dengan aman
export function useFavorites(): FavoritesCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFavorites outside FavoritesProvider');
  return v;
}
