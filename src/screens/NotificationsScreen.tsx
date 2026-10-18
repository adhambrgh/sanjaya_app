// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// hook useMemo untuk menghitung ulang gaya saat tema berganti
import { useMemo } from 'react';
// komponen React Native
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
// ikon Ionicons
import { Ionicons } from '@expo/vector-icons';
// hook preferensi (tema + notifikasi)
import { usePreferences, useColors } from '../store/preferences';
// tipe palet & font dari theme
import { F, type Palette } from '../theme';

// ===== DAFTAR SAKELAR NOTIFIKASI =====

// daftar pilihan notifikasi yang bisa dinyalakan/dimatikan
const ITEMS = [
  { key: 'promo', icon: 'pricetag-outline', title: 'Promo & Diskon', desc: 'Info penawaran dan potongan harga.' },
  { key: 'order', icon: 'receipt-outline', title: 'Status Pesanan', desc: 'Pemberitahuan saat pesanan diproses atau dikirim.' },
  { key: 'service', icon: 'construct-outline', title: 'Pengingat Servis', desc: 'Ingatkan jadwal servis berkala kendaraan.' },
] as const;

// ===== LAYAR NOTIFIKASI =====

// layar pengaturan notifikasi (toggle disimpan lokal)
export default function NotificationsScreen() {
  // ambil status & fungsi pengubah dari preferensi
  const { notif, setNotif } = usePreferences();
  // palet warna aktif + gaya yang dihitung ulang saat tema berganti
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* keterangan singkat */}
      <Text style={styles.intro}>Atur pemberitahuan yang ingin kamu terima.</Text>
      {/* kartu berisi sakelar */}
      <View style={styles.card}>
        {ITEMS.map((it, i) => (
          <View key={it.key} style={[styles.row, i < ITEMS.length - 1 && styles.rowBorder]}>
            {/* ikon */}
            <View style={styles.iconBox}>
              <Ionicons name={it.icon} size={18} color={c.primary} />
            </View>
            {/* teks */}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{it.title}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            {/* sakelar on/off */}
            <Switch
              value={notif[it.key]}
              onValueChange={(v) => setNotif(it.key, v)}
              trackColor={{ true: c.primary, false: c.border }}
              thumbColor={c.card}
            />
          </View>
        ))}
      </View>
      {/* catatan */}
      <Text style={styles.note}>Preferensi ini tersimpan di perangkat ini.</Text>
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
  // baris
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  // garis pemisah
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.borderSoft },
  // kotak ikon
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  // judul
  title: { fontSize: 14, fontFamily: F.semibold, color: c.text },
  // deskripsi
  desc: { fontSize: 12, fontFamily: F.regular, color: c.textMuted, marginTop: 2 },
  // catatan bawah
  note: { fontSize: 11.5, fontFamily: F.regular, color: c.textMuted, marginTop: 12, textAlign: 'center' },
});
