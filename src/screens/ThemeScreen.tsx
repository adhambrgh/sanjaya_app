// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// hook useMemo untuk menghitung ulang gaya saat tema berganti
import { useMemo } from 'react';
// komponen React Native
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// ikon Ionicons
import { Ionicons } from '@expo/vector-icons';
// hook preferensi (tema) + palet warna aktif
import { usePreferences, useColors, type Theme } from '../store/preferences';
// tipe palet & font dari theme
import { F, type Palette } from '../theme';

// ===== DAFTAR PILIHAN TEMA =====

// pilihan tema yang tersedia beserta ikon dan keterangannya
const OPTIONS: { key: Theme; label: string; icon: any; desc: string }[] = [
  { key: 'light', label: 'Terang', icon: 'sunny-outline', desc: 'Tampilan terang (bawaan).' },
  { key: 'dark', label: 'Gelap', icon: 'moon-outline', desc: 'Tampilan gelap untuk mata.' },
  { key: 'system', label: 'Ikuti Sistem', icon: 'phone-portrait-outline', desc: 'Menyesuaikan pengaturan perangkat.' },
];

// ===== LAYAR TEMA =====

// layar pemilihan tema aplikasi
export default function ThemeScreen() {
  // ambil tema aktif & fungsi pengubahnya
  const { theme, setTheme } = usePreferences();
  // palet warna aktif + gaya yang dihitung ulang saat tema berganti
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* pengantar */}
      <Text style={styles.intro}>Pilih tampilan yang paling nyaman untukmu.</Text>
      {/* daftar pilihan */}
      <View style={styles.card}>
        {OPTIONS.map((opt, i) => {
          // apakah pilihan ini aktif
          const active = theme === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.row, i < OPTIONS.length - 1 && styles.rowBorder]}
              activeOpacity={0.7}
              onPress={() => setTheme(opt.key)}
            >
              {/* ikon pilihan */}
              <View style={[styles.iconBox, active && styles.iconBoxActive]}>
                <Ionicons name={opt.icon} size={18} color={active ? '#fff' : c.primary} />
              </View>
              {/* teks */}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{opt.label}</Text>
                <Text style={styles.desc}>{opt.desc}</Text>
              </View>
              {/* tanda centang bila aktif */}
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={active ? c.primary : c.textFaint}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {/* catatan */}
      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={16} color={c.textMuted} />
        <Text style={styles.note}>Preferensi tema tersimpan dan langsung diterapkan ke seluruh layar.</Text>
      </View>
    </ScrollView>
  );
}

// ===== STYLE =====

// makeStyles = pembuat style berdasarkan palet warna aktif
const makeStyles = (c: Palette) => StyleSheet.create({
  // wadah layar
  container: { flex: 1, backgroundColor: c.bg },
  // area konten
  content: { padding: 16, paddingBottom: 40 },
  // teks pengantar
  intro: { fontSize: 13, fontFamily: F.regular, color: c.textMuted, marginBottom: 12, marginLeft: 4 },
  // kartu putih
  card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  // baris pilihan
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  // garis pemisah
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.borderSoft },
  // kotak ikon
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  // kotak ikon aktif (biru utama)
  iconBoxActive: { backgroundColor: c.primary },
  // judul
  title: { fontSize: 14, fontFamily: F.semibold, color: c.text },
  // deskripsi
  desc: { fontSize: 12, fontFamily: F.regular, color: c.textMuted, marginTop: 2 },
  // kotak catatan
  noteBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 14, paddingHorizontal: 6 },
  // teks catatan
  note: { flex: 1, fontSize: 11.5, fontFamily: F.regular, color: c.textMuted, lineHeight: 17 },
});
