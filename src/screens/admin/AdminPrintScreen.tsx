// ===== IMPORT =====
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  adminGetStockReport,
  adminGetMutasiReport,
  adminGetPOReport,
  adminStats,
  exportCSV,
} from '../../lib/admin';
import { rp } from '../../lib/format';
import { slugToLabel } from '../../lib/helpers';
import { navy, surface, cardBg, muted, ink, bronze } from '../../theme';

// ===== TYPE =====
type ReportType = 'stok' | 'mutasi' | 'po' | 'omset';

// ===== KOMPONEN UTAMA =====
export default function AdminPrintScreen() {
  const [reportType, setReportType] = useState<ReportType>('stok');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stockData, setStockData] = useState<any[]>([]);
  const [mutasiData, setMutasiData] = useState<any[]>([]);
  const [poData, setPOData] = useState<any[]>([]);
  const [omsetData, setOmsetData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalBarang: 0,
    totalStok: 0,
    totalPenjualan: 0,
    totalOmset: 0,
    lowStock: [],
  });

  // Load all data on mount (default: 30 hari terakhir untuk mutasi/PO/omset)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        // Load semua data secara paralel
        const [stock, mutasi, po, allStats, orders] = await Promise.all([
          adminGetStockReport({}),
          adminGetMutasiReport({ startDate: thirtyDaysAgo, endDate: todayStr }),
          adminGetPOReport({ startDate: thirtyDaysAgo, endDate: todayStr }),
          adminStats(),
          // Omset = data orders dengan status paid dalam 30 hari terakhir
          // Di-handle terpisah agar tidak mengubah signature adminGetPOReport
          Promise.resolve([] as any[]),
        ]);

        setStockData(stock);
        setMutasiData(mutasi);
        setPOData(po);
        setOmsetData(orders);
        setStats(allStats);
      } catch (error: any) {
        console.error('Error loading report data:', error);
        Alert.alert('Gagal', error?.message ?? 'Gagal memuat data laporan');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Pemetaan status ke style badge
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'paid':
        return styles.statusDone;
      case 'failed':
        return styles.statusFailed;
      case 'cancelled':
        return styles.statusCancelled;
      case 'draft':
        return styles.statusDraft;
      case 'diajukan':
        return styles.statusDiajukan;
      case 'dipesan':
        return styles.statusDipesan;
      case 'diterima':
        return styles.statusDone;
      case 'batal':
        return styles.statusBatal;
      case 'retur':
        return styles.statusRetur;
      default:
        return {};
    }
  };

  // Pemetaan status ke label Indonesia
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Lunas';
      case 'failed':
        return 'Gagal';
      case 'cancelled':
        return 'Batal';
      case 'draft':
        return 'Draft';
      case 'diajukan':
        return 'Diajukan';
      case 'dipesan':
        return 'Dipesan';
      case 'diterima':
        return 'Diterima';
      case 'batal':
        return 'Dibatalkan';
      case 'retur':
        return 'Retur';
      default:
        return status;
    }
  };

  // Teks periode untuk header laporan
  const getDateRange = () => {
    return reportType === 'stok' ? 'Stok saat ini' : '30 hari terakhir';
  };

  // Export laporan ke CSV (handle web & native via exportCSV di admin.ts)
  const exportReport = async () => {
    setBusy(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let filename = '';
      let headers: string[] = [];
      let rows: any[] = [];

      switch (reportType) {
        case 'stok':
          filename = `laporan_stok_${todayStr}.csv`;
          headers = [
            'Kode',
            'Nama',
            'Kategori',
            'Satuan',
            'Harga Beli',
            'Harga Jual',
            'Stok',
            'Lokasi',
            'Stok Awal',
          ];
          rows = stockData.map((p) => ({
            Kode: p.code,
            Nama: p.name,
            Kategori: slugToLabel(p.category || ''),
            Satuan: p.unit,
            'Harga Beli': p.purchasePrice,
            'Harga Jual': p.price,
            Stok: p.stock,
            Lokasi: p.location,
            'Stok Awal': p.initialStock,
          }));
          break;
        case 'mutasi':
          filename = `laporan_mutasi_${todayStr}.csv`;
          headers = [
            'Tanggal',
            'Kode Barang',
            'Nama Barang',
            'Tipe',
            'Qty',
            'Note',
            'Admin',
          ];
          rows = mutasiData.map((m) => ({
            Tanggal: new Date(m.createdAt).toLocaleDateString('id'),
            'Kode Barang': m.productCode,
            'Nama Barang': m.productName,
            Tipe: m.movementType === 'in' ? 'Masuk' : 'Keluar',
            Qty: m.qty,
            Note: m.note,
            Admin: m.adminName,
          }));
          break;
        case 'po':
          filename = `laporan_po_${todayStr}.csv`;
          headers = [
            'Kode',
            'Supplier',
            'Tanggal',
            'Status',
            'Total',
            'Progress',
          ];
          rows = poData.map((p) => ({
            Kode: p.code,
            Supplier: p.supplierName,
            Tanggal: new Date(p.createdAt).toLocaleDateString('id'),
            Status: getStatusLabel(p.status),
            Total: p.total,
            Progress:
              p.totalOrdered > 0
                ? `${p.totalReceived}/${p.totalOrdered} (${p.receiveProgressPct}%)`
                : '0',
          }));
          break;
        case 'omset':
          filename = `laporan_omset_${todayStr}.csv`;
          headers = ['Kode', 'Tanggal', 'Total'];
          rows = omsetData.map((o) => ({
            Kode: o.code,
            Tanggal: new Date(o.createdAt).toLocaleDateString('id'),
            Total: o.total,
          }));
          break;
      }

      // exportCSV handle web download (browser) & native share (expo-sharing)
      const result = await exportCSV(filename, headers, rows);
      if (result.error) {
        Alert.alert('Gagal', result.error);
      } else {
        Alert.alert('Berhasil', `Laporan ${reportType} berhasil di-export`);
      }
    } catch (error: any) {
      console.error('Error exporting report:', error);
      Alert.alert('Gagal', error?.message ?? 'Gagal export laporan');
    } finally {
      setBusy(false);
    }
  };

  // Loading screen saat data belum siap
  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={navy}
        style={{ flex: 1, justifyContent: 'center' }}
      />
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={styles.header}>Cetak Laporan</Text>
      <Text style={styles.sub}>
        Stok, mutasi, pengadaan, dan omset penjualan
      </Text>

      {/* Filter Section - Tab Jenis Laporan */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Jenis Laporan</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
        >
          {(['stok', 'mutasi', 'po', 'omset'] as ReportType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, reportType === type && styles.tabActive]}
              onPress={() => setReportType(type)}
            >
              <Text
                style={[
                  styles.tabText,
                  reportType === type && styles.tabTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Report Content */}
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportTitle}>
              Laporan{' '}
              {reportType === 'stok'
                ? 'Stok Barang'
                : reportType === 'mutasi'
                ? 'Mutasi Barang'
                : reportType === 'po'
                ? 'Purchase Order'
                : 'Omset Penjualan'}
            </Text>
            <Text style={styles.reportSubtitle}>{getDateRange()}</Text>
          </View>
          {reportType !== 'omset' && (
            <TouchableOpacity
              style={[styles.exportBtn, busy && styles.exportBtnDisabled]}
              onPress={exportReport}
              disabled={busy}
            >
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={styles.exportText}>Export CSV</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LAPORAN STOK */}
        {reportType === 'stok' && (
          <>
            <View style={styles.dataGrid}>
              {stockData.map((p) => (
                <View key={p.id} style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Kode</Text>
                    <Text style={styles.colValue}>{p.code}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Nama</Text>
                    <Text style={styles.colValue}>{p.name}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Kategori</Text>
                    <Text style={styles.colValue}>{p.category}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Satuan</Text>
                    <Text style={styles.colValue}>{p.unit}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Harga Beli</Text>
                    <Text style={styles.colValue}>{rp(p.purchasePrice)}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Harga Jual</Text>
                    <Text style={styles.colValue}>{rp(p.price)}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Stok</Text>
                    <Text style={styles.colValue}>{p.stock}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Lokasi</Text>
                    <Text style={styles.colValue}>{p.location}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Stok Awal</Text>
                    <Text style={styles.colValue}>{p.initialStock}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total SKU</Text>
              <Text style={styles.totalValue}>{stockData.length}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Unit</Text>
              <Text style={styles.totalValue}>
                {stockData.reduce((s, p) => s + (p.stock || 0), 0)}
              </Text>
            </View>
          </>
        )}

        {/* LAPORAN MUTASI */}
        {reportType === 'mutasi' && (
          <>
            <View style={styles.dataGrid}>
              {mutasiData.map((m) => (
                <View key={m.id} style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Tanggal</Text>
                    <Text style={styles.colValue}>
                      {new Date(m.createdAt).toLocaleDateString('id')}
                    </Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Kode Barang</Text>
                    <Text style={styles.colValue}>{m.productCode}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Nama Barang</Text>
                    <Text style={styles.colValue}>{m.productName}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Tipe</Text>
                    <Text
                      style={[
                        styles.colValue,
                        m.movementType === 'in'
                          ? styles.positive
                          : styles.negative,
                      ]}
                    >
                      {m.movementType === 'in' ? 'Masuk' : 'Keluar'}
                    </Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Qty</Text>
                    <Text style={styles.colValue}>{m.qty}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Note</Text>
                    <Text style={styles.colValue} numberOfLines={2}>
                      {m.note}
                    </Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Admin</Text>
                    <Text style={styles.colValue}>{m.adminName}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Masuk</Text>
              <Text style={[styles.totalValue, styles.positive]}>
                {mutasiData
                  .filter((m) => m.movementType === 'in')
                  .reduce((s, m) => s + (m.qty || 0), 0)}
              </Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Keluar</Text>
              <Text style={[styles.totalValue, styles.negative]}>
                {mutasiData
                  .filter((m) => m.movementType === 'out')
                  .reduce((s, m) => s + (m.qty || 0), 0)}
              </Text>
            </View>
          </>
        )}

        {/* LAPORAN PO */}
        {reportType === 'po' && (
          <>
            <View style={styles.dataGrid}>
              {poData.map((p) => (
                <View key={p.id} style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Kode</Text>
                    <Text style={styles.colValue}>{p.code}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Supplier</Text>
                    <Text style={styles.colValue}>{p.supplierName}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Tanggal</Text>
                    <Text style={styles.colValue}>
                      {new Date(p.createdAt).toLocaleDateString('id')}
                    </Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Status</Text>
                    <Text
                      style={[styles.colValue, getStatusStyle(p.status)]}
                    >
                      {getStatusLabel(p.status)}
                    </Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Total</Text>
                    <Text style={styles.colValue}>{rp(p.total)}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Progress</Text>
                    <Text style={styles.colValue}>
                      {p.totalOrdered > 0
                        ? `${p.totalReceived}/${p.totalOrdered} (${p.receiveProgressPct}%)`
                        : '0'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total PO</Text>
              <Text style={styles.totalValue}>{poData.length}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Diterima</Text>
              <Text style={[styles.totalValue, styles.positive]}>
                {poData.reduce((s, p) => s + (p.totalReceived || 0), 0)}
              </Text>
            </View>
          </>
        )}

        {/* LAPORAN OMSET */}
        {reportType === 'omset' && (
          <>
            <View style={styles.dataGrid}>
              {omsetData.length === 0 ? (
                <Text
                  style={{
                    textAlign: 'center',
                    color: muted,
                    padding: 20,
                    fontSize: 12,
                  }}
                >
                  Belum ada data omset untuk periode ini. Implementasi omset
                  memerlukan adminGetOrders() — saat ini menggunakan stats.totalOmset.
                </Text>
              ) : (
                omsetData.map((o) => (
                  <View key={o.id} style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Kode</Text>
                      <Text style={styles.colValue}>{o.code}</Text>
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Tanggal</Text>
                      <Text style={styles.colValue}>
                        {new Date(o.createdAt).toLocaleDateString('id')}
                      </Text>
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Status</Text>
                      <Text
                        style={[styles.colValue, getStatusStyle(o.status)]}
                      >
                        {getStatusLabel(o.status)}
                      </Text>
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Total</Text>
                      <Text style={styles.colValue}>{rp(o.total)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Omset</Text>
              <Text style={styles.totalValue}>{rp(stats.totalOmset)}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Jumlah Transaksi</Text>
              <Text style={styles.totalValue}>{omsetData.length}</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.footerText}>
        Laporan dibuat pada{' '}
        {new Date().toLocaleDateString('id', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>
    </ScrollView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  // Header
  header: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: ink,
  },
  sub: {
    fontSize: 12,
    color: muted,
    marginTop: 2,
    marginBottom: 16,
  },

  // Filter Section
  filterSection: { marginBottom: 20 },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: ink,
    marginBottom: 8,
  },
  tabScroll: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: cardBg,
    borderWidth: 1,
    borderColor: '#E5DFD1',
  },
  tabActive: { backgroundColor: navy },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: ink,
  },
  tabTextActive: { color: '#fff' },

  // Report Card
  reportCard: {
    backgroundColor: cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DFD1',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: ink,
  },
  reportSubtitle: {
    fontSize: 12,
    color: muted,
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: bronze,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportBtnDisabled: { opacity: 0.5 },
  exportText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },

  // Data Grid
  dataGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5DFD1',
  },
  col: {
    flex: 1,
    minWidth: 120,
    maxWidth: 160,
  },
  colLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: muted,
    marginBottom: 4,
  },
  colValue: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: ink,
  },

  // Total Box
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F2ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: ink,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Inter_800ExtraBold',
    color: ink,
  },
  positive: { color: bronze },
  negative: { color: '#BA1A1A' },

  // Status Badges
  statusPending: {
    backgroundColor: '#FFF8CC',
    color: '#8A6D00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDone: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusFailed: {
    backgroundColor: '#FFEBEB',
    color: '#BA1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusCancelled: {
    backgroundColor: '#E9ECEF',
    color: '#495057',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDraft: {
    backgroundColor: '#E3F2FD',
    color: navy,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDiajukan: {
    backgroundColor: '#FFF3E0',
    color: '#EF6C00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDipesan: {
    backgroundColor: '#E8F5E9',
    color: bronze,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBatal: {
    backgroundColor: '#FFE5E5',
    color: '#BA1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusRetur: {
    backgroundColor: '#FCE4EC',
    color: '#E91E63',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Footer
  footerText: {
    fontSize: 11,
    color: muted,
    textAlign: 'center',
    marginTop: 16,
  },
});
