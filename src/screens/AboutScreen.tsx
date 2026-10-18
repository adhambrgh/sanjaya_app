// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// hook useMemo untuk menghitung ulang gaya saat tema berganti
import { useMemo } from 'react';
// komponen React Native
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
// ikon Ionicons
import { Ionicons } from '@expo/vector-icons';
// data informasi toko (placeholder)
import { business } from '../lib/business';
// palet warna dinamis (Terang/Gelap) & font dari theme
import { useColors } from '../store/preferences';
import { F, type Palette } from '../theme';

// ===== LAYAR TENTANG =====

// layar informasi tentang toko Santren Jaya Motor
export default function AboutScreen() {
  // palet warna aktif + gaya yang dihitung ulang saat tema berganti
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ===== IDENTITAS APLIKASI ===== */}
      <View style={styles.brandBox}>
        <View style={styles.logoBox}>
          <Image source={require('../../assets/images/logosanjaya.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>{business.name}</Text>
        <Text style={styles.tagline}>{business.tagline}</Text>
        <Text style={styles.version}>Versi {business.version}</Text>
      </View>

      {/* ===== DESKRIPSI ===== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tentang Kami</Text>
        <Text style={styles.paragraph}>{business.description}</Text>
      </View>

      {/* ===== INFORMASI TOKO ===== */}
      <View style={styles.card}>
        {/* alamat */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={c.primary} />
          <Text style={styles.infoText}>{business.address}</Text>
        </View>
        {/* email */}
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={c.primary} />
          <Text style={styles.infoText}>{business.email}</Text>
        </View>
        {/* jam operasional */}
        <View style={styles.infoRowTop}>
          <Ionicons name="time-outline" size={18} color={c.primary} />
          <View style={{ flex: 1 }}>
            {business.hours.map((h) => (
              <View key={h.day} style={styles.hourRow}>
                <Text style={styles.infoText}>{h.day}</Text>
                <Text style={styles.hourTime}>{h.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ===== TOMBOL KONTAK ===== */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`https://wa.me/${business.whatsapp}`)}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.btnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => Linking.openURL(`tel:${business.phone.replace(/\s/g, '')}`)}>
          <Ionicons name="call-outline" size={18} color={c.primary} />
          <Text style={[styles.btnText, { color: c.primary }]}>Telepon</Text>
        </TouchableOpacity>
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
  // blok atas (logo + nama)
  brandBox: { alignItems: 'center', marginTop: 8, marginBottom: 18 },
  // lingkaran logo
  logoBox: { width: 76, height: 76, borderRadius: 38, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  // gambar logo
  logo: { width: 56, height: 56, borderRadius: 28 },
  // nama toko
  brand: { fontSize: 19, fontFamily: F.heading, color: c.text, marginTop: 12 },
  // slogan
  tagline: { fontSize: 12.5, fontFamily: F.regular, color: c.textMuted, marginTop: 2 },
  // versi
  version: { fontSize: 11.5, fontFamily: F.semibold, color: c.primary, marginTop: 6 },
  // kartu putih
  card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 },
  // judul kartu
  cardTitle: { fontSize: 13, fontFamily: F.bold, color: c.text, marginBottom: 8 },
  // paragraf
  paragraph: { fontSize: 13, fontFamily: F.regular, color: c.textMuted, lineHeight: 20 },
  // baris info
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  // baris info (atas, untuk jam)
  infoRowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  // teks info
  infoText: { flex: 1, fontSize: 13, fontFamily: F.regular, color: c.text },
  // baris jam
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  // jam (kanan)
  hourTime: { fontSize: 13, fontFamily: F.semibold, color: c.primary },
  // baris tombol
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  // tombol
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 14 },
  // tombol outline
  btnOutline: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.primary },
  // teks tombol
  btnText: { color: '#fff', fontFamily: F.bold, fontSize: 14 },
});
