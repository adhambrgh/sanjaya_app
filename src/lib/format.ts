// ===== FUNGSI FORMAT (formatting angka ke Rupiah) =====

// fungsi rp(n) mengubah angka menjadi format Rupiah Indonesia
// contoh: 58000 -> 'Rp 58.000', 185000 -> 'Rp 185.000'
// alur: buang desimal dengan Math.trunc, lalu tambahkan titik sebagai pemisah ribuan dari belakang
export function rp(n: number): string {
  // ambil bagian bulat (integer) dari angka
  const s = Math.trunc(n).toString();
  let out = '';
  let c = 0;
  // iterasi dari belakang (least significant) ke depan untuk menambahkan pemisah ribuan
  for (let i = s.length - 1; i >= 0; i--) {
    // tambahkan digit ke depan hasil
    out = s[i] + out;
    // setiap 3 digit (dihitung dari belakang), tambahkan titik kecuali digit paling depan
    if (++c % 3 === 0 && i !== 0) {
      out = '.' + out;
    }
  }
  // kembalikan dengan prefix 'Rp '
  return `Rp ${out}`;
}
