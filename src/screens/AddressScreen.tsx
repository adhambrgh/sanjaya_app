// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// React + hook: useCallback (fungsi stabil), useMemo (gaya dinamis)
import React, { useCallback, useMemo, useState } from 'react';
// komponen React Native
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
// useFocusEffect: muat ulang data setiap layar difokuskan
import { useFocusEffect } from '@react-navigation/native';
// ikon Ionicons
import { Ionicons } from '@expo/vector-icons';
// fungsi repo untuk CRUD alamat/kendaraan
import { getAddresses, saveAddress, deleteAddress, setDefaultAddress, type CustomerAddress } from '../repo';
// palet warna dinamis (Terang/Gelap) & font dari theme
import { useColors } from '../store/preferences';
import { F, type Palette } from '../theme';
// komponen loader halaman (spinner di tengah)
import PageLoader from '../components/PageLoader';

// ===== TIPE & NILAI AWAL =====

// jenis data yang dikelola
type Kind = 'address' | 'vehicle';

// isi form kosong
const EMPTY = {
  label: '', name: '', phone: '', address: '',
  vehicle_type: '', vehicle_model: '', plate: '', is_default: false,
};

// ===== KOMPONEN INPUT MODAL =====

// kolom input sederhana berlabel untuk form modal
function ModalField({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any;
}) {
  // palet warna aktif + gaya (dihitung ulang saat tema berganti)
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ===== LAYAR ALAMAT / KENDARAAN =====

// layar untuk mengelola daftar alamat pengiriman dan kendaraan pelanggan
export default function AddressScreen() {
  // tab aktif
  const [kind, setKind] = useState<Kind>('address');
  // daftar baris
  const [items, setItems] = useState<CustomerAddress[]>([]);
  // penanda memuat
  const [loading, setLoading] = useState(true);
  // penanda modal terbuka
  const [modal, setModal] = useState(false);
  // baris yang sedang diedit (null = tambah baru)
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  // isi form
  const [form, setForm] = useState({ ...EMPTY });
  // penanda proses simpan
  const [saving, setSaving] = useState(false);
  // palet warna aktif + gaya yang dihitung ulang saat tema berganti
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  // memuat data setiap kali tab berubah atau layar difokuskan kembali
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getAddresses(kind).then((rows) => {
        if (!active) return;
        setItems(rows);
        setLoading(false);
      });
      return () => { active = false; };
    }, [kind]),
  );

  // membuka form untuk menambah data baru
  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModal(true);
  };

  // membuka form untuk mengubah data
  const openEdit = (it: CustomerAddress) => {
    setEditing(it);
    setForm({
      label: it.label ?? '',
      name: it.name ?? '',
      phone: it.phone ?? '',
      address: it.address ?? '',
      vehicle_type: it.vehicle_type ?? '',
      vehicle_model: it.vehicle_model ?? '',
      plate: it.plate ?? '',
      is_default: it.is_default,
    });
    setModal(true);
  };

  // menyimpan data (tambah atau ubah)
  const submit = async () => {
    // validasi sederhana sesuai jenis
    if (kind === 'address' && !form.address.trim()) {
      notify('Belum lengkap', 'Alamat lengkap wajib diisi.');
      return;
    }
    if (kind === 'vehicle' && !form.vehicle_model.trim() && !form.plate.trim()) {
      notify('Belum lengkap', 'Isi minimal model motor atau nomor polisi.');
      return;
    }
    setSaving(true);
    // simpan ke database
    const ok = await saveAddress({ id: editing?.id, kind, ...form });
    setSaving(false);
    if (!ok) { notify('Gagal menyimpan', 'Terjadi kesalahan, coba lagi.'); return; }
    // tutup modal & muat ulang daftar
    setModal(false);
    reload();
  };

  // memuat ulang daftar sesuai tab aktif
  const reload = () => {
    getAddresses(kind).then(setItems);
  };

  // menghapus satu baris (dengan konfirmasi)
  const confirmDelete = (it: CustomerAddress) => {
    // aksi hapus sesungguhnya
    const doDelete = async () => {
      const ok = await deleteAddress(it.id);
      if (ok) reload();
      else notify('Gagal menghapus', 'Terjadi kesalahan, coba lagi.');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Hapus data ini?')) doDelete();
      return;
    }
    Alert.alert('Hapus', 'Hapus data ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: doDelete },
    ]);
  };

  // menjadikan satu baris sebagai utama
  const makeDefault = async (it: CustomerAddress) => {
    const ok = await setDefaultAddress(it.id, kind);
    if (ok) reload();
  };

  // notifikasi kecil lintas platform
  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  // teks judul kartu
  const cardTitle = (it: CustomerAddress) => it.label || it.name || (kind === 'address' ? 'Alamat' : 'Kendaraan');
  // teks detail kartu
  const cardDetail = (it: CustomerAddress) => {
    if (kind === 'address') return [it.name, it.phone, it.address].filter(Boolean).join(' · ');
    return [it.vehicle_model, it.vehicle_type, it.plate].filter(Boolean).join(' · ');
  };

  // ===== RENDER =====
  return (
    <View style={styles.container}>
      {/* pemilih tab Alamat / Kendaraan */}
      <View style={styles.segment}>
        <TouchableOpacity style={[styles.segItem, kind === 'address' && styles.segActive]} onPress={() => setKind('address')}>
          <Ionicons name="location-outline" size={16} color={kind === 'address' ? '#fff' : c.primary} />
          <Text style={[styles.segText, kind === 'address' && styles.segTextActive]}>Alamat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segItem, kind === 'vehicle' && styles.segActive]} onPress={() => setKind('vehicle')}>
          <Ionicons name="bicycle-outline" size={16} color={kind === 'vehicle' ? '#fff' : c.primary} />
          <Text style={[styles.segText, kind === 'vehicle' && styles.segTextActive]}>Kendaraan</Text>
        </TouchableOpacity>
      </View>

      {/* daftar data (saat memuat: area direntang penuh agar loader berada di tengah) */}
      <ScrollView contentContainerStyle={[styles.content, loading && { flexGrow: 1 }]}>
        {loading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          // keadaan kosong
          <View style={styles.empty}>
            <Ionicons name={kind === 'address' ? 'location-outline' : 'bicycle-outline'} size={44} color={c.textFaint} />
            <Text style={styles.emptyText}>
              Belum ada {kind === 'address' ? 'alamat tersimpan' : 'kendaraan tersimpan'}.
            </Text>
          </View>
        ) : (
          items.map((it) => (
            <View key={it.id} style={styles.card}>
              {/* ikon */}
              <View style={styles.cardIcon}>
                <Ionicons name={kind === 'address' ? 'location-sharp' : 'bicycle'} size={20} color={c.primary} />
              </View>
              {/* isi kartu */}
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{cardTitle(it)}</Text>
                  {it.is_default ? <Text style={styles.badge}>Utama</Text> : null}
                </View>
                <Text style={styles.cardDetail} numberOfLines={2}>{cardDetail(it)}</Text>
                {/* aksi */}
                <View style={styles.actions}>
                  {!it.is_default ? (
                    <TouchableOpacity onPress={() => makeDefault(it)}>
                      <Text style={styles.action}>Jadikan utama</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => openEdit(it)}>
                    <Text style={styles.action}>Ubah</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(it)}>
                    <Text style={[styles.action, { color: c.danger }]}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* tombol tambah (mengapung di bawah) */}
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.fabText}>Tambah {kind === 'address' ? 'Alamat' : 'Kendaraan'}</Text>
      </TouchableOpacity>

      {/* ===== MODAL FORM ===== */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            {/* judul modal */}
            <Text style={styles.sheetTitle}>{editing ? 'Ubah' : 'Tambah'} {kind === 'address' ? 'Alamat' : 'Kendaraan'}</Text>
            <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
              {/* label singkat (kedua jenis) */}
              <ModalField label="Label" value={form.label} onChangeText={(t) => setForm({ ...form, label: t })} placeholder={kind === 'address' ? 'Rumah / Kantor' : 'Motor utama'} />

              {kind === 'address' ? (
                <>
                  <ModalField label="Nama penerima" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholder="Nama penerima" />
                  <ModalField label="Nomor HP" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" />
                  <ModalField label="Alamat lengkap" value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} placeholder="Jalan, no. rumah, kota" />
                </>
              ) : (
                <>
                  <ModalField label="Jenis motor" value={form.vehicle_type} onChangeText={(t) => setForm({ ...form, vehicle_type: t })} placeholder="Matic / Bebek / Sport" />
                  <ModalField label="Model / tahun" value={form.vehicle_model} onChangeText={(t) => setForm({ ...form, vehicle_model: t })} placeholder="Honda Beat FI 2019" />
                  <ModalField label="Nomor polisi" value={form.plate} onChangeText={(t) => setForm({ ...form, plate: t })} placeholder="D 1234 ABC" />
                </>
              )}

              {/* sakelar jadikan utama */}
              <TouchableOpacity style={styles.checkRow} onPress={() => setForm({ ...form, is_default: !form.is_default })}>
                <Ionicons name={form.is_default ? 'checkbox' : 'square-outline'} size={22} color={c.primary} />
                <Text style={styles.checkText}>Jadikan {kind === 'address' ? 'alamat' : 'kendaraan'} utama</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* tombol aksi modal */}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setModal(false)}>
                <Text style={styles.btnGhostText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ===== STYLE =====

// makeStyles = pembuat style berdasarkan palet warna aktif
const makeStyles = (c: Palette) => StyleSheet.create({
  // wadah layar
  container: { flex: 1, backgroundColor: c.bg },
  // pemilih tab
  segment: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  // item tab
  segItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
  // item tab aktif
  segActive: { backgroundColor: c.primary, borderColor: c.primary },
  // teks tab
  segText: { fontSize: 13, fontFamily: F.semibold, color: c.primary },
  // teks tab aktif
  segTextActive: { color: '#fff' },
  // area daftar
  content: { padding: 16, paddingBottom: 90 },
  // kartu data
  card: { flexDirection: 'row', gap: 12, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 12 },
  // kotak ikon
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center' },
  // baris judul + badge
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // judul kartu
  cardTitle: { fontSize: 14.5, fontFamily: F.bold, color: c.text, flexShrink: 1 },
  // badge utama
  badge: { fontSize: 10, fontFamily: F.extrabold, color: c.warn, backgroundColor: c.accent + '33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  // detail kartu
  cardDetail: { fontSize: 12.5, fontFamily: F.regular, color: c.textMuted, marginTop: 3 },
  // baris aksi
  actions: { flexDirection: 'row', gap: 18, marginTop: 10 },
  // teks aksi
  action: { fontSize: 12.5, fontFamily: F.semibold, color: c.primary },
  // keadaan kosong
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  // teks kosong
  emptyText: { fontSize: 13, color: c.textMuted, fontFamily: F.regular },
  // tombol tambah mengapung
  fab: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15 },
  // teks tombol tambah
  fabText: { color: '#fff', fontFamily: F.bold, fontSize: 15 },
  // latar gelap modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  // lembar form modal
  sheet: { backgroundColor: c.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 26 },
  // judul modal
  sheetTitle: { fontSize: 17, fontFamily: F.bold, color: c.text, marginBottom: 14 },
  // label input
  label: { fontSize: 12, fontFamily: F.semibold, color: c.textMuted, marginBottom: 6 },
  // kotak input
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: F.regular, color: c.text, backgroundColor: c.input },
  // baris sakelar "jadikan utama"
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  // teks sakelar
  checkText: { fontSize: 13.5, fontFamily: F.regular, color: c.text },
  // baris tombol modal
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  // tombol batal (outline)
  btnGhost: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.primary, borderRadius: 12, paddingVertical: 13 },
  // teks tombol batal
  btnGhostText: { color: c.primary, fontFamily: F.bold, fontSize: 14 },
  // tombol simpan (utama)
  btnPrimary: { flex: 1.4, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, borderRadius: 12, paddingVertical: 13 },
  // teks tombol simpan
  btnText: { color: '#fff', fontFamily: F.bold, fontSize: 14 },
});
