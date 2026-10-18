# Plan: Migrasi Navigasi Admin ke Hamburger Menu Drawer

## Ringkasan
Admin saat ini punya 11 tab di bottom bar yang membuat tampilan sempit di layar HP. Plan ini memindahkan navigasi admin ke pola **Hamburger Menu Drawer** menggunakan `@react-navigation/drawer` (v7), dengan:
- **Header**: Ikon hamburger (☰) di kiri yang membuka side drawer
- **Drawer**: Menampilkan semua 11 menu lengkap (icon + label + badge)
- **Bottom Bar**: Dipangkas menjadi 5 tab utama (Dashboard, Inventaris, Aliran, Penjualan, PO)
- **Customer**: Tetap 5 tab seperti sekarang (tidak diubah)

---

## 0. Prasyarat: Fix CSV Export (Pending dari request sebelumnya)
Sebelum menyentuh navigasi, selesaikan fix export CSV di `src/screens/admin/AdminPrintScreen.tsx` (baris 150-195):
- Mapping field object (`p.code` → `'Kode'`, `p.purchasePrice` → `'Harga Beli'`, dst.) untuk semua tipe laporan (`stok`, `mutasi`, `po`, `omset`) agar `toCSV` membaca key yang sesuai header.

---

## 1. Install Dependensi
React Navigation saat ini v7 (`@react-navigation/native@7.5.0`, RN 0.86, Expo 57).

Perintah instalasi:
```bash
npx expo install @react-navigation/drawer react-native-reanimated
```
- `react-native-gesture-handler` sudah terpasang (v2.32.0).
- Expo SDK 57 / `babel-preset-expo` otomatis meng-handle plugin reanimated (tidak butuh config babel manual).

---

## 2. Inisialisasi Gesture Handler
- **`index.ts`**: Tambahkan `import 'react-native-gesture-handler';` di baris paling atas (wajib sebelum component render).
- **`App.tsx`**: Bungkus root komponen dengan `<GestureHandlerRootView style={{ flex: 1 }}>`.

---

## 3. Komponen Drawer: `src/components/layout/AdminDrawerContent.tsx`
Buat komponen kustom untuk isi drawer:
- **Header Drawer**: Logo SANJAYA, label "Admin Panel", versi/status
- **Menu List**: 11 menu dengan ikon Ionicons, label, dan badge low stock pada Inventaris
  1. Dashboard (`home`)
  2. Inventaris (`cube`, badge stok rendah)
  3. Aliran (`swap-vertical`)
  4. Online Shop (`storefront`)
  5. Dokumen (`document`)
  6. PO (`clipboard`)
  7. Supplier (`business`)
  8. Penjualan (`cart`)
  9. Cetak Laporan (`print`)
  10. Kategori (`folder`)
  11. Slide Banner (`images`)
- **Navigasi**: Mengetuk menu akan dispatch navigasi ke tab yang dituju + menutup drawer secara otomatis
- **Footer**: Tombol Keluar (Sign Out) opsional / info akun

---

## 4. Tombol Hamburger di Header
- Buat komponen `DrawerMenuButton` di `src/components/layout/DrawerMenuButton.tsx`:
  - Tombol ikon `menu` (☰) Ionicons warna `#fff`
  - Memanggil `DrawerActions.openDrawer()` via `useNavigation()`
- Pasang di `screenOptions.headerLeft` pada `AdminTabs` di `App.tsx`
- Sesuaikan `AppHeader` agar margin/jarak sejajar rapi dengan tombol hamburger

---

## 5. Restrukturisasi Navigator Admin di `App.tsx`

### A. Buat `AdminDrawer`
```tsx
const AdminDrawerNav = createDrawerNavigator();

function AdminDrawer({ onSignOut }: { onSignOut: () => void }) {
  return (
    <AdminDrawerNav.Navigator
      drawerContent={(props) => <AdminDrawerContent {...props} onSignOut={onSignOut} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280, backgroundColor: '#fff' },
        drawerType: 'front',
        swipeEdgeWidth: 50,
      }}
    >
      <AdminDrawerNav.Screen name="AdminMain">
        {() => <AdminTabs onSignOut={onSignOut} />}
      </AdminDrawerNav.Screen>
    </AdminDrawerNav.Navigator>
  );
}
```

### B. Modifikasi `AdminTabs`
- Tetap mendaftarkan ke-11 screen agar bisa dinavigasikan dari drawer
- 5 screen utama tetap tampil di bottom tab bar:
  - Dashboard
  - Inventaris (tetap ada badge)
  - Aliran
  - Penjualan
  - PO
- 6 screen sisanya disembunyikan dari tab bar via `tabBarItemStyle: { display: 'none' }`
- Tambahkan `headerLeft: () => <DrawerMenuButton />` di `screenOptions`

### C. Update `AdminStack`
Ganti target screen `AdminTabs` dari `<AdminTabs>` menjadi `<AdminDrawer>`.

---

## 6. Verifikasi & Pengujian
1. Jalankan `npx tsc --noEmit` untuk memastikan tidak ada error TypeScript
2. Jalankan `npx expo lint` untuk linting
3. Pengujian interaksi:
   - Ketuk ikon ☰ hamburger di header → drawer terbuka dari kiri
   - Geser dari tepi kiri layar (swipe gesture) → drawer terbuka
   - Pilih menu yang ada di bottom bar (misal: Inventaris) → pindah tab & drawer menutup
   - Pilih menu yang tersembunyi (misal: Cetak) → layar Cetak terbuka & drawer menutup
   - Badge stok rendah tetap muncul di tab Inventaris dan di drawer
   - Tombol logout di header dan drawer berfungsi normal
   - Back button Android menutup drawer bila sedang terbuka
   - Bottom bar untuk user customer tetap normal tidak berubah

---

## File yang Akan Diubah/Dibuat
| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/screens/admin/AdminPrintScreen.tsx` | Edit | Fix mapping field CSV stok, mutasi, PO, omset |
| `index.ts` | Edit | Tambah `import 'react-native-gesture-handler'` di baris 1 |
| `src/components/layout/DrawerMenuButton.tsx` | Buat | Tombol burger ☰ untuk header |
| `src/components/layout/AdminDrawerContent.tsx` | Buat | Tampilan kustom side drawer admin |
| `App.tsx` | Edit | `GestureHandlerRootView`, `AdminDrawer`, update `AdminTabs` 5 visible tabs + hidden 6 |
