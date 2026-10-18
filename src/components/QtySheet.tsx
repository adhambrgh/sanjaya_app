// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// mengambil React dan hook useState (menyimpan jumlah yang diketik pengguna) serta useMemo (memo gaya)
import React, { useState, useMemo } from 'react';
// mengambil komponen bawaan React Native:
// View (kotak/div), Text (teks), TouchableOpacity (tombol sentuh), StyleSheet (pembuat style),
// TextInput (kolom input), Modal (panel mengambang), KeyboardAvoidingView (menyesuaikan keyboard), Platform (deteksi OS)
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
// mengambil kumpulan ikon Ionicons dari Expo
import { Ionicons } from '@expo/vector-icons';
// mengambil fungsi rp (mengubah angka menjadi format Rupiah, contoh: Rp 85.000)
import { rp } from '../lib/format';
// mengambil tipe data Product (bentuk/struktur data produk)
import type { Product } from '../models';
// mengambil hook palet warna dinamis (Terang/Gelap) dan tipe paletnya
import { useColors } from '../store/preferences';
import type { Palette } from '../theme';

// ===== TIPE PROPS =====

// properti (props) yang diterima komponen QtySheet
type QtySheetProps = {
  // produk yang akan ditambahkan ke keranjang
  product: Product;
  // dipanggil saat panel ditutup (tombol silang / tekan area gelap / tombol Batal)
  onClose: () => void;
  // dipanggil saat pengguna menekan "Tambah ke Keranjang"; mengirim jumlah yang dipilih
  onConfirm: (qty: number) => void;
};

// ===== KOMPONEN UTAMA =====

// komponen bottom sheet untuk memilih jumlah sebelum menambah produk ke keranjang
// dipakai bersama oleh layar Detail dan layar Toko (Shop)
export default function QtySheet({ product, onClose, onConfirm }: QtySheetProps) {
  // state "qtyInput" menyimpan jumlah yang diketik pengguna (berupa teks); awalnya "1"
  const [qtyInput, setQtyInput] = useState('1');
  // palet warna aktif + gaya yang dihitung ulang saat tema berganti
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  // ===== NILAI TURUNAN UNTUK INPUT JUMLAH =====

  // stok maksimum yang boleh dibeli; minimal 1 agar selalu ada batas atas
  const maxQty = Math.max(1, Number(product.stock) || 0);
  // jumlah yang diketik diubah jadi angka; bila kosong/bukan angka dianggap 0
  const qtyNum = parseInt(qtyInput, 10) || 0;
  // qtyValid = jumlah sah dipakai bila minimal 1 dan tidak melebihi stok
  const qtyValid = qtyNum >= 1 && qtyNum <= maxQty;
  // daftar pilihan cepat jumlah: 1, 5, 10 yang masih <= stok, ditambah chip "Max" = stok bila belum tercakup
  const quickOptions: { v: number; label: string }[] = [1, 5, 10]
    .filter((v) => v <= maxQty)
    .map((v) => ({ v, label: String(v) }));
  if (maxQty > 0 && !quickOptions.some((o) => o.v === maxQty)) quickOptions.push({ v: maxQty, label: 'Max' });

  // ===== FUNGSI AKSI =====

  // fungsi stepQty = menambah/mengurangi jumlah lewat tombol +/- ; delta bisa +1 atau -1
  const stepQty = (delta: number) => {
    // hitung nilai baru dari jumlah saat ini, lalu kunci (clamp) di rentang 1..stok
    const next = Math.min(maxQty, Math.max(1, qtyNum + delta));
    // simpan kembali sebagai teks
    setQtyInput(String(next));
  };

  // fungsi confirm = memastikan jumlah valid lalu meneruskan ke pemanggil (onConfirm)
  const confirm = () => {
    // batalkan bila jumlah tidak valid (kosong, 0, atau melebihi stok)
    if (!qtyValid) return;
    // kirim jumlah yang dipilih ke pemanggil
    onConfirm(qtyNum);
  };

  // ===== TAMPILAN =====

  return (
    // Modal = panel mengambang; transparan; animasi slide dari bawah; tutup lewat tombol back Android (onRequestClose)
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* KeyboardAvoidingView = mendorong panel ke atas saat keyboard muncul (khusus iOS pakai padding) */}
      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* lapisan gelap transparan; ditekan untuk menutup panel (activeOpacity 1 agar tidak berkedip) */}
        <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose} />
        {/* panel bawah (bottom sheet) */}
        <View style={styles.sheet}>
          {/* pegangan atas (handle bar) penanda panel bisa ditarik */}
          <View style={styles.handle} />
          {/* judul panel */}
          <Text style={styles.sheetTitle}>Masuk Keranjang</Text>
          {/* nama produk yang akan ditambahkan, maksimal 2 baris */}
          <Text style={styles.sheetName} numberOfLines={2}>{product.name}</Text>
          {/* baris info: chip stok di kiri, harga satuan di kanan */}
          <View style={styles.sheetInfoRow}>
            {/* chip stok: ikon kubus + teks jumlah stok */}
            <View style={styles.stockChip}>
              {/* ikon kubus kecil */}
              <Ionicons name="cube-outline" size={12} color={c.warn} />
              {/* teks stok */}
              <Text style={styles.stockChipText}>Stok {product.stock} unit</Text>
            </View>
            {/* harga satuan produk */}
            <Text style={styles.sheetPrice}>{rp(product.price)}</Text>
          </View>

          {/* label "Jumlah" */}
          <Text style={styles.qtyLabel}>Jumlah</Text>
          {/* baris stepper besar: tombol kurang, kolom ketik, tombol tambah */}
          <View style={styles.qtyRow}>
            {/* tombol kurang; nonaktif bila jumlah sudah 1; ditekan mengurangi 1 */}
            <TouchableOpacity
              style={[styles.stepBtn, qtyNum <= 1 && styles.stepBtnDisabled]}
              onPress={() => stepQty(-1)}
              disabled={qtyNum <= 1}
            >
              {/* ikon minus; pucat bila nonaktif */}
              <Ionicons name="remove" size={22} color={qtyNum <= 1 ? c.border : c.primary} />
            </TouchableOpacity>
            {/* kolom input jumlah: bisa diketik langsung; hanya menerima angka */}
            <TextInput
              // style input; garis tepi merah bila jumlah tidak valid
              style={[styles.qtyInputBig, !qtyValid && styles.qtyInputErr]}
              // nilai berupa teks jumlah
              value={qtyInput}
              // saat berubah: buang semua karakter selain angka 0-9
              onChangeText={(t) => setQtyInput(t.replace(/[^0-9]/g, ''))}
              // keyboard angka
              keyboardType="number-pad"
              // batas panjang karakter (maks 6 digit)
              maxLength={6}
              // saat fokus, seluruh teks langsung terpilih agar mudah diganti
              selectTextOnFocus
            />
            {/* tombol tambah; nonaktif bila jumlah sudah mencapai stok; ditekan menambah 1 */}
            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnPlus, qtyNum >= maxQty && { opacity: 0.5 }]}
              onPress={() => stepQty(1)}
              disabled={qtyNum >= maxQty}
            >
              {/* ikon plus */}
              <Ionicons name="add" size={22} color="#261A00" />
            </TouchableOpacity>
          </View>

          {/* baris chip pilihan cepat jumlah (misal 1, 5, 10, Max) */}
          <View style={styles.quickRow}>
            {/* ulangi setiap pilihan cepat menjadi satu chip */}
            {quickOptions.map((o) => (
              // chip; aktif (latar kuning aksen) bila sama dengan jumlah saat ini
              <TouchableOpacity
                key={o.v}
                style={[styles.quickChip, qtyNum === o.v && styles.quickChipActive]}
                onPress={() => setQtyInput(String(o.v))}
              >
                {/* label chip (angka atau "Max") */}
                <Text style={[styles.quickChipText, qtyNum === o.v && styles.quickChipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* pesan error: tampil bila jumlah melebihi stok */}
          {qtyNum > maxQty ? (
            <Text style={styles.errorText}>Stok hanya {product.stock} unit</Text>
          ) : null}

          {/* garis pemisah */}
          <View style={styles.sheetDivider} />
          {/* baris subtotal: harga satuan x jumlah */}
          <View style={styles.sheetTotalRow}>
            {/* label subtotal */}
            <Text style={styles.sheetTotalLabel}>Subtotal</Text>
            {/* nilai subtotal (0 bila jumlah belum valid) */}
            <Text style={styles.sheetTotalValue}>{rp(product.price * (qtyValid ? qtyNum : 0))}</Text>
          </View>

          {/* baris tombol aksi: Batal + Tambah ke Keranjang */}
          <View style={styles.sheetActions}>
            {/* tombol Batal: menutup panel */}
            <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
              {/* teks Batal */}
              <Text style={styles.sheetCancelText}>Batal</Text>
            </TouchableOpacity>
            {/* tombol tambah; opacity 0.5 & nonaktif bila jumlah tidak valid */}
            <TouchableOpacity
              style={[styles.sheetCta, !qtyValid && { opacity: 0.5 }]}
              onPress={confirm}
              disabled={!qtyValid}
            >
              {/* ikon keranjang */}
              <Ionicons name="cart" size={18} color="#fff" />
              {/* teks tombol */}
              <Text style={styles.sheetCtaText}>Tambah ke Keranjang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ===== STYLE (pengaturan tampilan) =====

// StyleSheet.create membuat kumpulan style yang bisa dipanggil dengan nama, contoh styles.sheet
// makeStyles = pembuat style berdasarkan palet warna aktif
const makeStyles = (c: Palette) => StyleSheet.create({
  // pembungkus modal: mengisi layar, isi didorong ke bawah (panel muncul dari bawah)
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  // lapisan tak berwarna (tanpa peredup); tetap dipakai agar panel bisa ditutup saat ditekan di luar
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  // panel bottom sheet: latar kartu, sudut atas membulat 24, padding 20, bayangan biru utama ke atas
  sheet: {
    backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 28,
    shadowColor: c.primary, shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: -6 }, elevation: 16,
  },
  // pegangan atas: lebar 40 tinggi 4, sudut 2, abu, di tengah dengan jarak bawah 14
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 14 },
  // judul panel: ukuran 16, tebal, warna teks utama
  sheetTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: c.text },
  // nama produk pada panel: ukuran 13, warna abu, jarak atas 4
  sheetName: { fontSize: 13, color: c.textMuted, marginTop: 4, lineHeight: 18 },
  // baris info stok + harga: menyamping, rata tengah, kiri-kanan tersebar, jarak atas 12
  sheetInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  // chip stok: menyamping, rata tengah, jarak isi 5, latar chip, sudut 8, garis tepi krem
  stockChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.chip, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: c.border },
  // teks chip stok: ukuran 11, tebal, warna kuning gelap
  stockChipText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: c.warn },
  // harga satuan pada panel: ukuran 18, tebal, warna biru utama
  sheetPrice: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: c.primary },
  // label "Jumlah": ukuran 12, tebal, warna teks utama, jarak atas 18 bawah 8
  qtyLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: c.text, marginTop: 18, marginBottom: 8 },
  // baris stepper: menyamping, rata kiri agar sejajar dengan label Jumlah, chip cepat, dan elemen atas/bawah lain
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', overflow: 'visible' },
  // tombol step (+/-): 52x52, sudut 14, garis tepi abu, isi di tengah; flexShrink 0 agar tidak menyusut
  stepBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // kondisi tombol step nonaktif: garis tepi lebih pucat
  stepBtnDisabled: { borderColor: c.border },
  // tombol plus: latar kuning aksen dengan garis tepi senada; flexShrink 0 agar tidak menyusut
  stepBtnPlus: { backgroundColor: c.accent, borderColor: c.accent, flexShrink: 0 },
  // kolom input jumlah: lebar tetap 96 (bukan flex) + jarak kiri/kanan 10 (pengganti gap), sehingga
  // ketiga elemen (kurang, angka, tambah) berukuran pasti, angka persis di tengah, dan tampil di semua platform
  // textAlign/vertical & padding 0 agar angka benar-benar berada di tengah kotak
  qtyInputBig: {
    width: 96, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: c.border,
    marginHorizontal: 10, flexShrink: 0,
    fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: c.text,
    textAlign: 'center', textAlignVertical: 'center', paddingHorizontal: 0, paddingVertical: 0,
  },
  // kondisi input tidak valid: garis tepi merah
  qtyInputErr: { borderColor: c.danger },
  // baris chip cepat: menyamping, jarak antar isi 8, jarak atas 12, boleh membungkus baris
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  // chip cepat: padding horizontal 16 vertikal 8, sudut 10, latar chip, garis tepi krem
  quickChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: c.chip, borderWidth: 1, borderColor: c.border },
  // chip cepat aktif: latar kuning aksen dengan garis tepi senada
  quickChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  // teks chip cepat: ukuran 12, tebal, warna teks utama
  quickChipText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: c.text },
  // teks chip cepat aktif: warna cokelat gelap agar kontras dengan latar kuning aksen
  quickChipTextActive: { color: '#261A00' },
  // teks error: ukuran 11, tebal, merah, jarak atas 6
  errorText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: c.danger, marginTop: 6 },
  // garis pemisah pada panel: tinggi 1, warna krem, jarak atas 18
  sheetDivider: { height: 1, backgroundColor: c.border, marginTop: 18 },
  // baris subtotal: menyamping, rata tengah, kiri-kanan tersebar, jarak atas 12
  sheetTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  // label subtotal: ukuran 13, warna abu
  sheetTotalLabel: { fontSize: 13, color: c.textMuted },
  // nilai subtotal: ukuran 18, tebal, warna biru utama
  sheetTotalValue: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: c.primary },
  // baris tombol aksi: menyamping, jarak antar isi 10, jarak atas 18
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  // tombol Batal: porsi 1, garis tepi, sudut 12, padding vertikal 14, isi di tengah
  sheetCancel: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  // teks Batal: tebal, warna biru utama
  sheetCancelText: { fontFamily: 'Inter_700Bold', color: c.primary },
  // tombol CTA: porsi 2, latar biru utama, sudut 12, padding vertikal 14, isi di tengah menyamping, jarak isi 8
  sheetCta: { flex: 2, backgroundColor: c.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  // teks CTA: putih, tebal, ukuran 14
  sheetCtaText: { color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 14 },
});
