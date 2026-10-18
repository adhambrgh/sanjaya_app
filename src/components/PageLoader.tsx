// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// mengambil React
import React from 'react';
// mengambil komponen bawaan React Native:
// View (kotak/div), ActivityIndicator (animasi loading), StyleSheet (pembuat style)
import { View, ActivityIndicator, StyleSheet } from 'react-native';
// mengambil hook palet warna aktif (Terang/Gelap)
import { useColors } from '../store/preferences';

// ===== KOMPONEN =====

// PageLoader = loader halaman: spinner besar di tengah dengan latar warna latar aplikasi
export default function PageLoader() {
  // palet warna aktif (Terang/Gelap)
  const c = useColors();
  // return = tampilan loader
  return (
    // wadah: mengisi seluruh area halaman & memusatkan spinner
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      {/* spinner besar memakai warna utama */}
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

// ===== STYLE =====
const styles = StyleSheet.create({
  // wadah loader: mengisi area, isi rata tengah (horizontal & vertikal)
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
