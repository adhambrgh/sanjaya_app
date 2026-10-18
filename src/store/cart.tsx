// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// mengambil React dan hook: createContext (membuat konteks global), useContext (menggunakan konteks),
// useState (state lokal), useCallback (menghindari re-render tak perlu), useEffect (efek samping),
// useMemo (menghitung ulang nilai teroptimasi), useRef (menyimpan nilai tanpa trigger re-render)
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
// mengambil AsyncStorage dari Expo/React Native AsyncStorage untuk menyimpan keranjang secara persisten di perangkat
import AsyncStorage from '@react-native-async-storage/async-storage';
// mengambil klien Supabase untuk mendeteksi perubahan status autentikasi (user login/logout)
import { supabase } from '../lib/supabase';
// mengambil tipe data: CartItem (isi keranjang: produk + jumlah) dan Product (data produk)
import type { CartItem, Product } from '../models';

// ===== TYPE (tipe data untuk state dan konteks keranjang) =====

// tipe state keranjang yang akan disimpan dan dihitung untuk ditampilkan
type CartState = {
  // daftar item di keranjang (produk beserta qty-nya)
  items: CartItem[];
  // kode kupon yang sedang aktif, null jika tidak ada
  coupon: string | null;
  // jumlah harga sebelum diskon
  subtotal: number;
  // besar diskon yang diterapkan (berdasarkan kupon)
  discount: number;
  // total akhir yang harus dibayar (subtotal - discount, dibatasi)
  total: number;
  // jumlah total item (jumlah qty seluruh produk)
  itemCount: number;
  // daftar id produk yang dicentang untuk ikut di-checkout
  selectedIds: string[];
  // item keranjang yang dicentang (hanya yang akan dibeli)
  selectedItems: CartItem[];
  // jumlah item/baris yang dicentang
  selectedCount: number;
  // jumlah harga dari item yang dicentang
  selectedSubtotal: number;
  // besar diskon untuk item yang dicentang
  selectedDiscount: number;
  // total akhir dari item yang dicentang
  selectedTotal: number;
  // apakah semua item di keranjang sudah dicentang
  allSelected: boolean;
};

// tipe konteks keranjang = gabungan state + fungsi-fungsi aksi yang bisa dipanggil komponen lain
type CartCtx = CartState & {
  // menambahkan produk ke keranjang dengan jumlah opsional (default 1); otomatis dibatasi stok
  // produk baru juga akan otomatis ditandai terpilih
  add: (p: Product, qty?: number) => void;
  // menambah jumlah qty item berdasarkan index (+1, berhenti di batas stok)
  inc: (idx: number) => void;
  // mengurangi jumlah qty item berdasarkan index (jika qty menjadi 1 dan dikurangi, item dihapus)
  dec: (idx: number) => void;
  // mengubah jumlah qty item secara langsung (mis. dari kolom input); dibatasi 1..stok
  setQty: (idx: number, qty: number) => void;
  // menghapus item dari keranjang berdasarkan index
  remove: (idx: number) => void;
  // mengosongkan seluruh keranjang (items kosong, coupon null)
  // juga mereset seleksi item
  clear: () => void;
  // menerapkan kupon (akan di-normalisasi ke uppercase)
  applyCoupon: (code: string) => void;
  // menghapus semua item yang sedang dicentang
  removeSelected: () => void;
  // mengganti status centang sebuah produk (toggle)
  toggleSelect: (id: string) => void;
  // memilih semua item di keranjang
  selectAll: () => void;
  // membatalkan semua centang
  clearSelection: () => void;
};

// ===== KONTEKS =====

// membuat konteks React untuk membagikan state & aksi keranjang ke seluruh komponen anak
// nilai awal null; komponen harus dipanggil di dalam CartProvider
const Ctx = createContext<CartCtx | null>(null);

// ===== HELPER FUNGSI (parsing data tersimpan) =====

// fungsi helper untuk mengurai (parse) string JSON hasil baca AsyncStorage
// bertujuan memvalidasi struktur data: harus ada items berupa array, tiap item harus punya product dan qty berupa number
const parse = (raw: string | null): { items: CartItem[]; coupon: string | null } | null => {
  // jika tidak ada data tersimpan, kembalikan null
  if (!raw) return null;
  try {
    // mencoba mengurai JSON
    const p = JSON.parse(raw);
    // validasi dasar: objek tidak null dan items harus array
    if (!p || !Array.isArray(p.items)) return null;
    // memfilter item agar hanya item valid yang dipertahankan (menghindari data rusak)
    const items = p.items.filter((e: any) => e && e.product && typeof e.qty === 'number');
    // mengembalikan data terparsing dengan coupon yang valid (string) atau null
    return { items, coupon: typeof p.coupon === 'string' ? p.coupon : null };
  } catch {
    // jika JSON tidak valid, anggap tidak ada data tersimpan yang bisa dipakai
    return null;
  }
};

// ===== PROVIDER (penyedia konteks keranjang) =====

// komponen provider yang membungkus aplikasi (atau bagian) agar bisa mengakses keranjang
// menyediakan state items, coupon, subtotal, discount, total, itemCount beserta fungsi aksi
export function CartProvider({ children }: { children: React.ReactNode }) {
  // ===== STATE =====

  // state daftar item keranjang
  const [items, setItems] = useState<CartItem[]>([]);
  // state kode kupon yang diterapkan
  const [coupon, setCoupon] = useState<string | null>(null);
  // state daftar id produk yang dicentang untuk ikut di-checkout (tidak dipersist, reset tiap buka)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ===== REF (penyimpan nilai yang tidak memicu re-render) =====

  // keyRef: menyimpan kunci AsyncStorage aktif, dipisahkan per user
  // alasan: agar keranjang user yang login tidak bercampur dengan tamu, dan saat logout/login berganti user
  // nilai awal 'cart_anon' untuk mode tamu (belum login)
  const keyRef = useRef<string>('cart_anon');
  // hydratedRef: penanda apakah keranjang sudah di-load (hydrate) dari AsyncStorage minimal sekali
  // mencegah overwrite data ke AsyncStorage sebelum data tersimpan berhasil dibaca saat berganti user
  const hydratedRef = useRef(false);
  // stateRef: snapshot state terkini (items + coupon) untuk disimpan saat berganti user
  // dipakai karena effect berganti user bisa berjalan sebelum state terbaru ter-capture di closure
  const stateRef = useRef({ items, coupon });
  // selectedRef: snapshot id item terpilih terkini untuk dibaca di dalam callback aksi
  // (tidak ikut dipersist ke AsyncStorage karena seleksi tidak disimpan antar sesi)
  const selectedRef = useRef<string[]>([]);
  // sinkronkan snapshot ref setelah render (lewat effect, bukan saat render)
  useEffect(() => {
    stateRef.current = { items, coupon };
    selectedRef.current = selectedIds;
  }, [items, coupon, selectedIds]);

  // ===== COMPUTED VALUE (dihitung otomatis dari state) =====

  // subtotal: jumlah total harga = sum(price * qty) untuk tiap item
  // useMemo agar dihitung ulang hanya saat items berubah
  const subtotal = useMemo(() => items.reduce((a, e) => a + e.product.price * e.qty, 0), [items]);
  // itemCount: jumlah total unit barang = sum(qty) seluruh item
  // berguna untuk menampilkan badge jumlah di keranjang/navbar
  const itemCount = useMemo(() => items.reduce((a, e) => a + e.qty, 0), [items]);
  // discount: aturan kupon sederhana - jika kupon 'SANJAYABERKAH' dapat diskon Rp 10.000
  const discount = coupon === 'SANJAYABERKAH' ? 10000 : 0;
  // total: subtotal dikurangi diskon, dipastikan >= 0 dan <= batas atas untuk keamanan tampilan
  const total = Math.max(0, Math.min(999999999, subtotal - discount));

  // selectedItems: item keranjang yang dicentang (hanya ini yang ikut di-checkout)
  const selectedItems = useMemo(
    () => items.filter((e) => selectedIds.includes(e.product.id)),
    [items, selectedIds],
  );
  // selectedCount: jumlah baris/item yang dicentang
  const selectedCount = selectedItems.length;
  // selectedSubtotal: jumlah harga dari item yang dicentang
  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((a, e) => a + e.product.price * e.qty, 0),
    [selectedItems],
  );
  // selectedDiscount: diskon kupon hanya berlaku bila ada item terpilih
  const selectedDiscount = coupon === 'SANJAYABERKAH' && selectedSubtotal > 0 ? 10000 : 0;
  // selectedTotal: total akhir dari item terpilih (>= 0)
  const selectedTotal = Math.max(0, selectedSubtotal - selectedDiscount);
  // allSelected: true bila keranjang tidak kosong dan semua barisnya sudah dicentang
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  // ===== EFFECT 1: sinkronisasi keranjang per user (berpindah key saat auth berubah) =====

  // alasan kenapa perlu: keranjang harus dipersist berdasarkan userId (kunci 'cart_${userId || 'anon'}')
  // sehingga saat user logout, keranjang tamu tetap ada; saat login, keranjang milik user dimuat kembali
  // effect ini dijalankan sekali saat provider mount ([]), lalu mendengarkan perubahan auth
  useEffect(() => {
    // flag 'active' untuk mencegah setState setelah komponen unmount
    let active = true;

    // fungsi untuk beralih ke kunci keranjang berdasarkan uid
    // 1. simpan state keranjang saat ini ke kunci lama (jika sudah pernah hydrate) sebelum berpindah
    // 2. tentukan nextKey = cart_{uid} atau cart_anon
    // 3. baca data tersimpan di nextKey dari AsyncStorage
    // 4. hydrate state (items, coupon) dengan data tersimpan atau kosongkan
    const switchTo = async (uid: string | undefined) => {
      // simpan state lama ke key lama sebelum pindah
      // kondisi: hydratedRef.current true artinya kita sudah pernah memuat data sebelumnya (bukan initial kosong)
      if (hydratedRef.current) {
        await AsyncStorage.setItem(
          keyRef.current,
          JSON.stringify(stateRef.current),
        );
      }

      // menentukan kunci baru berdasarkan user id; jika tidak ada uid, gunakan 'anon' (mode tamu)
      const nextKey = `cart_${uid || 'anon'}`;
      // memperbarui keyRef ke kunci aktif saat ini
      keyRef.current = nextKey;

      // membaca data keranjang tersimpan untuk kunci baru
      const stored = parse(await AsyncStorage.getItem(nextKey));
      if (!active) return;
      // tandai sudah hydrate (minimal sekali) agar effect write bisa mulai menulis
      hydratedRef.current = true;
      // mengisi state dengan data tersimpan, atau kosongkan jika tidak ada
      setItems(stored?.items ?? []);
      setCoupon(stored?.coupon ?? null);
      // seleksi selalu mulai kosong saat keranjang dimuat (tidak dipersist)
      setSelectedIds([]);
    };

    // ambil user saat ini untuk menentukan kunci keranjang awal
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) switchTo(user?.id);
    });

    // subscribe perubahan status auth (login, logout, refresh session)
    // saat auth berubah, panggil switchTo dengan user id session terbaru
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      switchTo(session?.user?.id);
    });

    // cleanup: tandai tidak aktif dan unsubscribe listener auth
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ===== EFFECT 2: persist ke AsyncStorage setiap kali state berubah =====

  // alasan: setiap perubahan items/coupon harus disimpan ke AsyncStorage dengan kunci per user
  // kondisi: hanya menulis setelah proses hydrate selesai (hydratedRef.current true)
  // agar tidak menimpa data tersimpan dengan state kosong saat pertama kali switch key
  useEffect(() => {
    if (!hydratedRef.current) return;
    // menulis state terkini { items, coupon } ke kunci aktif
    AsyncStorage.setItem(keyRef.current, JSON.stringify({ items, coupon }));
  }, [items, coupon]);

  // ===== AKSI (fungsi-fungsi manipulasi keranjang) =====

  // add: menambahkan produk ke keranjang dengan jumlah yang dipilih (qty)
  // jika produk dengan id sama sudah ada, jumlah lama DITAMBAH qty baru
  // jika belum ada, buat item baru dengan qty tersebut
  // qty selalu dibatasi (clamp) ke rentang 1..stok agar tidak melebihi stok produk
  const add = useCallback((p: Product, qty: number = 1) => {
    setItems((prev) => {
      // batas maksimum pembelian = stok produk (minimal 1 agar tetap bisa ditambah walau stok 0 saat data)
      const max = Math.max(1, p.stock);
      // cari posisi produk di keranjang
      const i = prev.findIndex((e) => e.product.id === p.id);
      if (i >= 0) {
        // produk sudah ada -> tambahkan qty baru ke qty lama, tetapi tidak boleh melebihi stok (max)
        return prev.map((e, k) => (k === i ? { ...e, qty: Math.min(max, e.qty + qty) } : e));
      }
      // produk belum ada -> tambahkan item baru dengan qty yang dibatasi 1..stok
      return [...prev, { product: p, qty: Math.min(max, Math.max(1, qty)) }];
    });
    // produk yang baru ditambahkan otomatis ditandai terpilih agar langsung siap dibayar
    setSelectedIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]));
  }, []);

  // inc: menambah qty item pada index tertentu (+1)
  // qty berhenti di batas stok produk (tidak bisa melebihi stok)
  const inc = useCallback((idx: number) => {
    setItems((prev) => prev.map((e, k) => (k === idx ? { ...e, qty: Math.min(Math.max(1, e.product.stock), e.qty + 1) } : e)));
  }, []);

  // dec: mengurangi qty item pada index tertentu (-1)
  // jika qty > 1, kurangi qty
  // jika qty == 1, hapus item dari keranjang (tidak boleh qty 0)
  const dec = useCallback((idx: number) => {
    // catat item sebelum diubah, untuk tahu id-nya bila nanti terhapus
    const cur = stateRef.current.items[idx];
    setItems((prev) => {
      const v = prev[idx];
      if (!v) return prev;
      if (v.qty > 1) {
        // masih > 1 -> kurangi qty
        return prev.map((e, k) => (k === idx ? { ...e, qty: e.qty - 1 } : e));
      }
      // qty == 1 -> hapus item
      return prev.filter((_, k) => k !== idx);
    });
    // bila item habis dan terhapus, buang juga dari daftar terpilih
    if (cur && cur.qty <= 1) setSelectedIds((prev) => prev.filter((x) => x !== cur.product.id));
  }, []);

  // setQty: mengubah jumlah item secara langsung (mis. dari kolom input di keranjang)
  // nilai dibatasi (clamp) ke rentang 1..stok agar tidak melebihi stok maupun jadi 0
  const setQty = useCallback((idx: number, qty: number) => {
    setItems((prev) => prev.map((e, k) => (k === idx ? { ...e, qty: Math.min(Math.max(1, e.product.stock), Math.max(1, qty)) } : e)));
  }, []);

  // clear: mengosongkan keranjang (items kosong, coupon null)
  // sekaligus menghapus data tersimpan di AsyncStorage untuk kunci aktif
  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
    // hapus juga seluruh seleksi item
    setSelectedIds([]);
    AsyncStorage.removeItem(keyRef.current);
  }, []);

  // remove: menghapus item dari keranjang berdasarkan index
  const remove = useCallback((idx: number) => {
    // catat id item yang akan dihapus agar bisa dibuang dari seleksi
    const id = stateRef.current.items[idx]?.product.id;
    setItems((prev) => prev.filter((_, k) => k !== idx));
    // buang item tersebut dari daftar terpilih bila ada
    if (id) setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  // removeSelected: menghapus semua item yang sedang dicentang dari keranjang
  const removeSelected = useCallback(() => {
    // ambil snapshot id terpilih terkini
    const sel = selectedRef.current;
    // saring item yang tidak terpilih agar tetap tinggal di keranjang
    if (sel.length) setItems((prev) => prev.filter((e) => !sel.includes(e.product.id)));
    // kosongkan seleksi setelah dihapus
    setSelectedIds([]);
  }, []);

  // toggleSelect: mengganti status centang sebuah produk (dicentang <-> tidak)
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  // selectAll: mencentang semua item yang ada di keranjang saat ini
  const selectAll = useCallback(() => {
    setSelectedIds(stateRef.current.items.map((e) => e.product.id));
  }, []);

  // clearSelection: membatalkan semua centang
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // applyCoupon: menerapkan kode kupon
  // di-trim spasi dan dikonversi ke UPPERCASE agar pencocokan case-insensitive & konsisten
  const applyCoupon = useCallback((code: string) => setCoupon(code.trim().toUpperCase()), []);

  // ===== RETURN PROVIDER =====

  // membentuk objek state gabungan (termasuk data item terpilih & totalnya)
  const state: CartState = {
    items, coupon, subtotal, discount, total, itemCount,
    selectedIds, selectedItems, selectedCount, selectedSubtotal, selectedDiscount, selectedTotal, allSelected,
  };
  // menyediakan nilai konteks berisi state + semua aksi
  return (
    <Ctx.Provider
      value={{
        ...state,
        add, inc, dec, setQty, remove, clear, applyCoupon,
        removeSelected, toggleSelect, selectAll, clearSelection,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// ===== HOOK PENGGUNA KONTEKS =====

// custom hook untuk mengakses konteks keranjang dengan aman
// akan melempar error jika dipanggil di luar CartProvider (mencegah misuse)
export function useCart(): CartCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart outside CartProvider');
  return v;
}