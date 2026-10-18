// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// mengambil React dan hook: createContext (membuat konteks global), useContext (menggunakan konteks),
// useState (state lokal), useCallback (menghindari re-render tak perlu)
import React, { createContext, useContext, useState, useCallback } from 'react';

// ===== TYPE (tipe data untuk konteks mode tamu) =====

// tipe data untuk konteks Guest (mode tamu / guest mode)
// menjelaskan nilai dan fungsi yang tersedia untuk komponen
type GuestCtx = {
  // penanda apakah aplikasi sedang dalam mode tamu (guest)
  // jika true, user tidak harus login untuk mengakses beberapa fitur
  isGuest: boolean;
  // fungsi untuk masuk ke mode tamu
  enter: () => void;
  // fungsi untuk keluar dari mode tamu
  exit: () => void;
};

// ===== KONTEKS =====

// membuat konteks React untuk membagikan status mode tamu ke seluruh komponen anak
// nilai awal null; hanya bisa digunakan di dalam GuestProvider
const Ctx = createContext<GuestCtx | null>(null);

// ===== PROVIDER (penyedia konteks mode tamu) =====

// komponen provider untuk mengelola mode tamu di aplikasi
// membungkus anak-anak komponen agar bisa mengakses state isGuest, enter, dan exit
export function GuestProvider({ children }: { children: React.ReactNode }) {
  // ===== STATE =====

  // state untuk menyimpan status mode tamu
  // nilai awal false = tidak dalam mode tamu (biasanya user normal/terautentikasi)
  const [isGuest, setIsGuest] = useState(false);

  // ===== FUNGSI AKSI =====

  // fungsi enter: mengaktifkan mode tamu
  // useCallback untuk mengoptimasi referensi fungsi (tidak dibuat ulang tiap render)
  const enter = useCallback(() => setIsGuest(true), []);

  // fungsi exit: menonaktifkan mode tamu dan kembali ke mode normal
  const exit = useCallback(() => setIsGuest(false), []);

  // ===== RETURN PROVIDER =====

  // menyediakan nilai konteks: status isGuest beserta fungsi enter dan exit
  return <Ctx.Provider value={{ isGuest, enter, exit }}>{children}</Ctx.Provider>;
}

// ===== HOOK PENGGUNA KONTEKS =====

// custom hook useGuest untuk mengakses konteks mode tamu dengan aman
// akan melempar error jika dipanggil di luar GuestProvider (mencegah penggunaan yang salah)
export function useGuest(): GuestCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGuest outside GuestProvider');
  return v;
}