// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// mengambil React + hook: useState (state), useRef (penanda hydrate), useCallback (fungsi stabil), useEffect (muat/simpan)
import React, { useState, useRef, useCallback, useEffect } from 'react';
// useColorScheme = hook bawaan React Native untuk mengetahui mode terang/gelap perangkat (untuk opsi 'system')
import { useColorScheme } from 'react-native';
// AsyncStorage untuk menyimpan preferensi secara persisten di perangkat
import AsyncStorage from '@react-native-async-storage/async-storage';
// palet warna dinamis untuk mode Terang & Gelap
import { lightPalette, darkPalette, type Palette } from '../theme';

// ===== TYPE (tipe data preferensi) =====

// pilihan tema: Terang, Gelap, atau ikut pengaturan sistem
export type Theme = 'light' | 'dark' | 'system';
// pengaturan notifikasi: tiga sakelar on/off
export type Notif = { promo: boolean; order: boolean; service: boolean };

// bentuk nilai konteks preferensi
type PrefsCtx = {
  // tema yang dipilih pengguna (light/dark/system)
  theme: Theme;
  // tema efektif setelah opsi 'system' diselesaikan (selalu 'light' atau 'dark')
  resolvedTheme: 'light' | 'dark';
  // true bila tema efektif sedang gelap
  isDark: boolean;
  // palet warna aktif sesuai tema efektif
  colors: Palette;
  // pengaturan notifikasi
  notif: Notif;
  // fungsi mengganti tema
  setTheme: (t: Theme) => void;
  // fungsi mengubah satu sakelar notifikasi
  setNotif: (key: keyof Notif, value: boolean) => void;
};

// ===== NILAI DEFAULT & KUNCI STORAGE =====

// tema awal: terang
const DEFAULT_THEME: Theme = 'light';
// notifikasi awal: semuanya aktif
const DEFAULT_NOTIF: Notif = { promo: true, order: true, service: true };
// kunci penyimpanan di AsyncStorage
const STORAGE_KEY = 'customer_prefs_v1';

// ===== KONTEKS =====

// konteks preferensi; wajib dipakai di dalam PreferencesProvider
const Ctx = React.createContext<PrefsCtx | null>(null);

// ===== PROVIDER =====

// komponen penyedia preferensi yang membungkus aplikasi
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  // state tema aktif
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  // state pengaturan notifikasi
  const [notif, setNotifState] = useState<Notif>(DEFAULT_NOTIF);
  // penanda preferensi sudah dimuat dari storage (mencegah menimpa sebelum baca selesai)
  const hydrated = useRef(false);
  // mode gelap/terang perangkat (dipakai saat tema = 'system')
  const scheme = useColorScheme();

  // effect: muat preferensi tersimpan sekali saat aplikasi dibuka
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          // urai JSON tersimpan
          const p = JSON.parse(raw) as { theme?: Theme; notif?: Partial<Notif> };
          // pakai tema hanya jika nilainya dikenal
          if (p.theme === 'light' || p.theme === 'dark' || p.theme === 'system') setThemeState(p.theme);
          // gabungkan notifikasi tersimpan dengan default
          if (p.notif) setNotifState({ ...DEFAULT_NOTIF, ...p.notif });
        } catch {
          // abaikan data rusak, tetap pakai default
        }
      }
      // tandai sudah dimuat
      hydrated.current = true;
    });
  }, []);

  // effect: simpan preferensi setiap kali tema/notifikasi berubah (setelah hydrate)
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, notif })).catch(() => {});
  }, [theme, notif]);

  // fungsi mengganti tema
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  // fungsi mengubah satu sakelar notifikasi
  const setNotif = useCallback((key: keyof Notif, value: boolean) => {
    setNotifState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // tema efektif: jika pilihan 'system', ikuti mode perangkat; selain itu pakai pilihan langsung
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : theme;
  // palet warna yang dipakai seluruh aplikasi sesuai tema efektif
  const colors = resolvedTheme === 'dark' ? darkPalette : lightPalette;
  // penanda cepat apakah sedang mode gelap
  const isDark = resolvedTheme === 'dark';

  // sediakan nilai konteks untuk seluruh anak komponen
  return <Ctx.Provider value={{ theme, resolvedTheme, isDark, colors, notif, setTheme, setNotif }}>{children}</Ctx.Provider>;
}

// ===== HOOK =====

// hook untuk mengakses preferensi; melempar error bila dipakai di luar provider
export function usePreferences(): PrefsCtx {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('usePreferences outside PreferencesProvider');
  return v;
}

// hook ringkas untuk mengambil palet warna aktif saja (dipakai di gaya tiap layar)
export function useColors(): Palette {
  return usePreferences().colors;
}
