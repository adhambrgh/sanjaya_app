// ===== TYPE (tipe callback) =====

// tipe fungsi callback yang akan dipanggil ketika event focus terjadi
type Fn = () => void;

// ===== STATE INTERNAL (daftar listener) =====

// Set berisi semua fungsi listener yang terdaftar
// menggunakan Set (bukan array) untuk mencegah duplikasi listener
const listeners = new Set<Fn>();

// ===== EVENT BUS SEDERHANA (Shop Search Bus) =====

// event bus untuk komunikasi antar komponen terkait pencarian toko (shop search)
// berguna untuk memicu fokus ke input pencarian dari komponen lain tanpa prop drilling
// pola publish/subscribe sederhana (observer pattern)
export const shopSearchBus = {
  // ===== FUNGSI PUBLISH =====

  // memicu event 'focus' - memanggil semua listener yang terdaftar
  // dipakai ketika ingin memfokuskan input pencarian (misal dari tombol atau shortcut)
  focus() {
    // jalankan semua callback listener
    listeners.forEach((fn) => fn());
  },

  // ===== FUNGSI SUBSCRIBE =====

  // mendaftarkan listener untuk event focus
  // mengembalikan fungsi unsubscribe untuk menghapus listener (cleanup)
  // penting untuk mencegah memory leak saat komponen unmount
  subscribe(fn: Fn): () => void {
    // tambahkan listener ke Set
    listeners.add(fn);
    // kembalikan fungsi untuk berhenti berlangganan
    return () => {
      // hapus listener dari Set
      listeners.delete(fn);
    };
  },
};