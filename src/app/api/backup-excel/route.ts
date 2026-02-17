import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-firestore'
import { collection, getDocs, Timestamp } from 'firebase/firestore'

// GET - Export all data to Excel format (JSON for frontend to convert)
export async function GET(request: NextRequest) {
  try {
    // Fetch all data
    const [pelangganSnap, supplierSnap, produkSnap, transaksiSnap, detailTransaksiSnap, pembelianSnap, detailPembelianSnap, hutangSnap, cashFlowSnap, kartuStokSnap] = await Promise.all([
      getDocs(collection(db, 'pelanggan')),
      getDocs(collection(db, 'supplier')),
      getDocs(collection(db, 'produk')),
      getDocs(collection(db, 'transaksi')),
      getDocs(collection(db, 'detailTransaksi')),
      getDocs(collection(db, 'pembelian')),
      getDocs(collection(db, 'detailPembelian')),
      getDocs(collection(db, 'hutang')),
      getDocs(collection(db, 'cashFlow')),
      getDocs(collection(db, 'kartuStok'))
    ])
    
    // Convert timestamps to strings
    const convertTimestamp = (ts: Timestamp | Date | string | undefined) => {
      if (!ts) return ''
      if (typeof ts === 'string') return ts
      if (ts instanceof Date) return ts.toISOString()
      return ts.toDate().toISOString()
    }
    
    // Process data
    const pelanggan = pelangganSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const supplier = supplierSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const produk = produkSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const transaksi = transaksiSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const detailTransaksi = detailTransaksiSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const pembelian = pembelianSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const detailPembelian = detailPembelianSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const hutang = hutangSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const cashFlow = cashFlowSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const kartuStok = kartuStokSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Create Excel-ready data with proper formatting
    const excelData = {
      exportDate: new Date().toISOString(),
      sheets: {
        'Pelanggan': pelanggan.map((p: any) => ({
          'ID': p.id,
          'No. Pelanggan': p.noPelanggan || '',
          'Nama': p.nama,
          'Telepon': p.telepon || '',
          'Alamat': p.alamat || '',
          'Tanggal Daftar': convertTimestamp(p.createdAt)
        })),
        'Supplier': supplier.map((s: any) => ({
          'ID': s.id,
          'Kode': s.kode || '',
          'Nama': s.nama,
          'Telepon': s.telepon || '',
          'Email': s.email || '',
          'Alamat': s.alamat || '',
          'Tanggal Daftar': convertTimestamp(s.createdAt)
        })),
        'Produk': produk.map((p: any) => ({
          'ID': p.id,
          'Nama': p.nama,
          'Barcode': p.barcode || '',
          'Kategori': p.kategori || '',
          'Satuan': p.satuan || 'pcs',
          'Harga Beli': p.hargaBeli || 0,
          'Harga Jual': p.hargaJual || 0,
          'Stok': p.stok || 0,
          'Stok Minimum': p.stokMinimum || 0,
          'Supplier ID': p.supplierId || '',
          'Tanggal Buat': convertTimestamp(p.createdAt)
        })),
        'Transaksi': transaksi.map((t: any) => ({
          'ID': t.id,
          'No. Nota': t.noNota,
          'Tanggal': convertTimestamp(t.tanggal),
          'Pelanggan ID': t.pelangganId || '',
          'Subtotal': t.subtotal || 0,
          'Diskon': t.diskon || 0,
          'Pajak': t.pajak || 0,
          'Total': t.total || 0,
          'Bayar': t.bayar || 0,
          'Kembalian': t.kembalian || 0,
          'Metode': t.metodePembayaran,
          'Status': t.status
        })),
        'Detail Transaksi': detailTransaksi.map((d: any) => ({
          'ID': d.id,
          'Transaksi ID': d.transaksiId,
          'Produk ID': d.produkId,
          'Jumlah': d.jumlah,
          'Harga': d.harga,
          'Subtotal': d.subtotal
        })),
        'Pembelian': pembelian.map((p: any) => ({
          'ID': p.id,
          'No. Faktur': p.noFaktur,
          'Tanggal': convertTimestamp(p.tanggal),
          'Supplier ID': p.supplierId,
          'Total Harga': p.totalHarga || 0,
          'Ongkir': p.biayaOngkir || 0,
          'Biaya Lain': p.biayaLain || 0,
          'Grand Total': p.grandTotal || 0,
          'Status': p.status,
          'Keterangan': p.keterangan || ''
        })),
        'Detail Pembelian': detailPembelian.map((d: any) => ({
          'ID': d.id,
          'Pembelian ID': d.pembelianId,
          'Produk ID': d.produkId,
          'Jumlah': d.jumlah,
          'Harga Beli': d.hargaBeli,
          'Subtotal': d.subtotal
        })),
        'Hutang': hutang.map((h: any) => ({
          'ID': h.id,
          'Pelanggan ID': h.pelangganId,
          'Transaksi ID': h.transaksiId,
          'Total Hutang': h.totalHutang,
          'Sisa Hutang': h.sisaHutang,
          'Jatuh Tempo': convertTimestamp(h.jatuhTempo),
          'Status': h.status
        })),
        'Cash Flow': cashFlow.map((c: any) => ({
          'ID': c.id,
          'Tipe': c.tipe,
          'Kategori': c.kategori,
          'Jumlah': c.jumlah,
          'Keterangan': c.keterangan || '',
          'Tanggal': convertTimestamp(c.tanggal)
        })),
        'Kartu Stok': kartuStok.map((k: any) => ({
          'ID': k.id,
          'Produk ID': k.produkId,
          'Tanggal': convertTimestamp(k.tanggal),
          'Tipe': k.tipe,
          'Referensi': k.referensi,
          'Jumlah': k.jumlah,
          'Stok Sebelum': k.stokSebelum,
          'Stok Sesudah': k.stokSesudah,
          'Keterangan': k.keterangan || ''
        })),
        'Pembelian per Pelanggan': generatePembelianPerPelanggan(transaksi, detailTransaksi, pelanggan, produk)
      },
      summary: {
        totalPelanggan: pelanggan.length,
        totalSupplier: supplier.length,
        totalProduk: produk.length,
        totalTransaksi: transaksi.length,
        totalPembelian: pembelian.length,
        totalHutang: hutang.length,
        totalCashFlow: cashFlow.length
      }
    }
    
    return NextResponse.json(excelData)
  } catch (error: any) {
    console.error('Error exporting to Excel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Generate Pembelian per Pelanggan summary
function generatePembelianPerPelanggan(transaksi: any[], detailTransaksi: any[], pelanggan: any[], produk: any[]) {
  const pelangganMap: Record<string, { nama: string; noPelanggan: string; totalTransaksi: number; totalQty: number; totalNilai: number; produk: Record<string, number> }> = {}
  
  // Create pelanggan lookup
  const pelangganLookup: Record<string, any> = {}
  pelanggan.forEach(p => { pelangganLookup[p.id] = p })
  
  // Create produk lookup
  const produkLookup: Record<string, any> = {}
  produk.forEach(p => { produkLookup[p.id] = p })
  
  // Process transactions
  transaksi.forEach(t => {
    if (!t.pelangganId) return // Skip walk-in customers
    
    const pel = pelangganLookup[t.pelangganId]
    if (!pel) return
    
    if (!pelangganMap[t.pelangganId]) {
      pelangganMap[t.pelangganId] = {
        nama: pel.nama,
        noPelanggan: pel.noPelanggan || '',
        totalTransaksi: 0,
        totalQty: 0,
        totalNilai: 0,
        produk: {}
      }
    }
    
    pelangganMap[t.pelangganId].totalTransaksi++
    pelangganMap[t.pelangganId].totalNilai += t.total || 0
    
    // Get detail transaksi for this transaction
    const details = detailTransaksi.filter(d => d.transaksiId === t.id)
    details.forEach(d => {
      pelangganMap[t.pelangganId].totalQty += d.jumlah || 0
      const prod = produkLookup[d.produkId]
      if (prod) {
        if (!pelangganMap[t.pelangganId].produk[prod.nama]) {
          pelangganMap[t.pelangganId].produk[prod.nama] = 0
        }
        pelangganMap[t.pelangganId].produk[prod.nama] += d.jumlah || 0
      }
    })
  })
  
  // Convert to array format
  const result: any[] = []
  Object.entries(pelangganMap).forEach(([id, data]) => {
    result.push({
      'ID Pelanggan': id,
      'No. Pelanggan': data.noPelanggan,
      'Nama Pelanggan': data.nama,
      'Total Transaksi': data.totalTransaksi,
      'Total Qty': data.totalQty,
      'Total Nilai': data.totalNilai
    })
  })
  
  return result.sort((a, b) => b['Total Nilai'] - a['Total Nilai'])
}
