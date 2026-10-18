// ===== WARNA (color palette aplikasi) =====

// warna utama brand (navy biru tua) - digunakan untuk header, tombol utama, dan highlight
export const navy = '#0B3D91';
// varian navy lebih gelap - untuk efek hover/pressed atau gradient
export const navyDark = '#062965';
// warna aksen (kuning-amber) - untuk CTA (call to action), badge, highlight penting
export const amber = '#FDC003';
// warna teks utama (hitam kebiruan) - untuk judul dan teks penting agar kontras tinggi
export const ink = '#131B2E';
// warna teks sekunder (abu-abu) - untuk caption, subtitle, teks bantu
export const muted = '#434652';
// warna latar belakang utama (cream/beige sangat terang) - background layar
export const surface = '#F7F5F0';
// warna latar belakang kartu (cream hangat) - untuk card/container
export const cardBg = '#FDF6F0';
// warna latar belakang chip/tag (cream lebih pucat) - untuk chip, pill, badge background
export const chipBg = '#F9F5EB';
// warna aksen biru soft - untuk background ikon atau elemen dekoratif
export const softBlue = '#C8D6FF';
// warna bronze (coklat keemasan) - untuk aksen warna sekunder, badge, atau teks khusus
export const bronze = '#785900';
// warna coklat workshop/bengkel - untuk elemen branding atau ilustrasi
export const workshopBrown = '#4A3B2A';

// ===== PALET WARNA DINAMIS (untuk mode Terang & Gelap) =====

// kumpulan token warna semantik yang dipakai seluruh layar.
// Dengan token ini, saat tema berganti cukup ganti nilai palet, bukan tiap warna satu per satu.
export type Palette = {
  // latar layar
  bg: string;
  // latar layar alternatif (mis. halaman login yang agak lebih gelap)
  bgAlt: string;
  // latar kartu / panel putih
  card: string;
  // latar kartu hangat (tona lebih lembut)
  cardSoft: string;
  // latar chip / tag kecil
  chip: string;
  // latar kolom isian (input)
  input: string;
  // garis tepi utama
  border: string;
  // garis tepi lembut / pemisah
  borderSoft: string;
  // garis tepi untuk input/button secondary (sedikit lebih gelap dari border)
  borderInput: string;
  // garis tepi untuk card
  borderCard: string;
  // warna teks utama
  text: string;
  // warna teks sekunder
  textMuted: string;
  // warna teks paling redup (placeholder/keterangan kecil)
  textFaint: string;
  // warna brand utama (tombol/link/ikon aktif)
  primary: string;
  // latar lembut untuk ikon berbasis brand
  primarySoft: string;
  // warna teks/ikon di atas primary
  onPrimary: string;
  // warna aksen (kuning brand)
  accent: string;
  // warna peringatan/error
  danger: string;
  // latar lembut untuk aksi berbahaya (mis. geser-hapus)
  dangerSoft: string;
  // warna teks peringatan lembut (mis. stok menipis)
  warn: string;
  // warna sukses
  success: string;
  // warna bayangan
  shadow: string;
  // ===== Status badge colors (untuk konsistensi badge di seluruh app) =====
  // background badge pending (kuning lembut)
  statusPendingBg: string;
  // background badge success (hijau lembut)
  statusSuccessBg: string;
  // background badge failed/danger (merah lembut)
  statusDangerBg: string;
  // background badge warning (orange lembut)
  statusWarningBg: string;
  // background badge info/draft (biru lembut)
  statusInfoBg: string;
  // background badge retur (pink lembut)
  statusReturBg: string;
  // background surface alternatif (untuk total box dll)
  surfaceAlt: string;
  // overlay modal (semi-transparan hitam)
  modalOverlay: string;
};

// palet Mode Terang (mengikuti warna lama aplikasi)
export const lightPalette: Palette = {
  bg: '#F7F5F0',
  bgAlt: '#EAE8E3',
  card: '#FFFFFF',
  cardSoft: '#FDF6F0',
  chip: '#F9F5EB',
  input: '#F5F5F3',
  border: '#ECEDF3',
  borderSoft: '#F0F1F5',
  borderInput: '#D8D2C4',
  borderCard: '#E5DFD1',
  text: '#131B2E',
  textMuted: '#434652',
  textFaint: '#8b8fa3',
  primary: '#0B3D91',
  primarySoft: '#EAF0FF',
  onPrimary: '#FFFFFF',
  accent: '#FDC003',
  danger: '#BA1A1A',
  dangerSoft: '#FEE2E2',
  warn: '#785900',
  success: '#15803D',
  shadow: '#0B3D91',
  // Status badges
  statusPendingBg: '#FFF8CC',
  statusSuccessBg: '#E8F5E9',
  statusDangerBg: '#FFEBEB',
  statusWarningBg: '#FFF3E0',
  statusInfoBg: '#E3F2FD',
  statusReturBg: '#FCE4EC',
  surfaceAlt: '#F5F2ED',
  modalOverlay: 'rgba(0,0,0,0.4)',
};

// palet Mode Gelap (biru tua untuk latar, teks terang, biru brand yang lebih terang agar terbaca)
export const darkPalette: Palette = {
  bg: '#0E1116',
  bgAlt: '#0A0D12',
  card: '#161B22',
  cardSoft: '#1A2029',
  chip: '#1C2230',
  input: '#1B212B',
  border: '#2A3140',
  borderSoft: '#232A36',
  borderInput: '#3A4252',
  borderCard: '#2A3140',
  text: '#E6E8EE',
  textMuted: '#9BA1AD',
  textFaint: '#6B7280',
  primary: '#5B8DEF',
  primarySoft: '#1B2740',
  onPrimary: '#FFFFFF',
  accent: '#FDC003',
  danger: '#F87171',
  dangerSoft: '#3A1515',
  warn: '#FDC003',
  success: '#4ADE80',
  shadow: '#000000',
  // Status badges (lebih gelap di mode gelap)
  statusPendingBg: '#3A2E00',
  statusSuccessBg: '#0F2E1A',
  statusDangerBg: '#3A1515',
  statusWarningBg: '#3A2200',
  statusInfoBg: '#0F2540',
  statusReturBg: '#3A0F1F',
  surfaceAlt: '#1A2029',
  modalOverlay: 'rgba(0,0,0,0.6)',
};

// ===== FONT FAMILY MAP (mapping nama font untuk kemudahan penggunaan) =====

// objek F berisi nama font family yang telah di-load (melalui Expo Font)
// dipakai agar pemanggilan font konsisten di seluruh komponen
export const F = {
  // font Inter (body text) - berat reguler
  regular: 'Inter_400Regular',
  // Inter medium
  medium: 'Inter_500Medium',
  // Inter semibold
  semibold: 'Inter_600SemiBold',
  // Inter bold
  bold: 'Inter_700Bold',
  // Inter extra bold - umumnya dipakai untuk value/nilai tebal di kartu
  extrabold: 'Inter_800ExtraBold',
  // Inter black (paling tebal)
  black: 'Inter_900Black',
  // font Poppins (heading) - semibold untuk judul
  heading: 'Poppins_600SemiBold',
  // Poppins bold untuk heading yang lebih menonjol
  headingBold: 'Poppins_700Bold',
  // Poppins extra bold/black untuk heading hero
  headingBlack: 'Poppins_800ExtraBold',
};
