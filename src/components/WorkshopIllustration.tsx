// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// mengambil React (library inti React)
import React from 'react';
// mengambil komponen bawaan React Native: View (wadah), Image (gambar), Text (teks), StyleSheet (pembuat style)
import { View, Image, Text, StyleSheet } from 'react-native';
// mengambil warna muted dari theme untuk teks keterangan
import { muted } from '../theme';

// ===== KOMPONEN UTAMA =====

// komponen ilustrasi brand yang menampilkan logo Sanjaya dan keterangan layanan
// dipakai di beberapa layar (misal Home, landing, atau bagian info toko) untuk memperkuat branding
export default function WorkshopIllustration() {
  // ===== RETURN TAMPILAN =====

  return (
    // wadah utama komponen, berisi gambar dan caption
    <View style={styles.wrap}>
      {/* gambar logo Sanjaya
         - source diambil dari file assets/images/logosanjaya.png (bundled oleh Metro/Expo)
         - resizeMode="contain" menjaga rasio aspek gambar tanpa terpotong */}
      <Image
        source={require('../../assets/images/logosanjaya.png')}
        style={styles.img}
        resizeMode="contain"
      />
      {/* teks keterangan layanan yang ditawarkan (branding/USP toko) */}
      <Text style={styles.caption}>Sparepart asli • Servis berkala • Garansi sebulan</Text>
    </View>
  );
}

// ===== STYLE (pengaturan tampilan komponen) =====

// StyleSheet.create untuk mengelompokkan style agar rapi dan bisa dipakai berulang
const styles = StyleSheet.create({
  // wrap: wadah pembungkus, memusatkan konten secara horizontal, memberi jarak bawah kecil
  wrap: { alignItems: 'center', marginBottom: 2 },
  // img: pengaturan gambar logo - ukuran persegi tetap agar rapi (tidak melar) & jarak atas-bawah rapat
  img: { width: 140, height: 140 },
  // caption: teks keterangan di bawah gambar - ukuran kecil, warna muted, jarak atas, rata tengah
  caption: { fontSize: 10, color: muted, marginTop: 2, textAlign: 'center' },
});