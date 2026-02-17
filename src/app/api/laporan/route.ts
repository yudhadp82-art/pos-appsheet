import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-firestore'

// GET - Get profit report with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dariTanggal = searchParams.get('dariTanggal')
    const sampaiTanggal = searchParams.get('sampaiTanggal')
    const tipe = searchParams.get('tipe') || 'harian' // harian, bulanan, produk

    // Get all transactions
    const transaksiSnapshot = await db.collection('transaksi').get()
    const transaksiData = transaksiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all detail transaksi
    const detailSnapshot = await db.collection('detailTransaksi').get()
    const details = detailSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all produk
    const produkSnapshot = await db.collection('produk').get()
    const produkList = produkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all pembelian
    const pembelianSnapshot = await db.collection('pembelian').get()
    const pembelianData = pembelianSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all cash flow
    const cashFlowSnapshot = await db.collection('cashFlow').get()
    const cashFlowData = cashFlowSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Filter by date range
    let filteredTransaksi = transaksiData
    let filteredPembelian = pembelianData
    let filteredCashFlow = cashFlowData

    if (dariTanggal) {
      filteredTransaksi = filteredTransaksi.filter(t => t.tanggal >= dariTanggal)
      filteredPembelian = filteredPembelian.filter(p => p.tanggal >= dariTanggal)
      filteredCashFlow = filteredCashFlow.filter(c => c.tanggal >= dariTanggal)
    }

    if (sampaiTanggal) {
      filteredTransaksi = filteredTransaksi.filter(t => t.tanggal <= sampaiTanggal + 'T23:59:59')
      filteredPembelian = filteredPembelian.filter(p => p.tanggal <= sampaiTanggal + 'T23:59:59')
      filteredCashFlow = filteredCashFlow.filter(c => c.tanggal <= sampaiTanggal + 'T23:59:59')
    }

    // Calculate profit
    let totalPenjualan = 0
    let totalHpp = 0 // Harga Pokok Penjualan
    let totalPembelian = 0
    let totalPendapatanLain = 0
    let totalPengeluaran = 0

    // Calculate from transactions
    filteredTransaksi.forEach(t => {
      totalPenjualan += t.total || 0
      
      // Calculate HPP from detail transaksi
      const transDetails = details.filter(d => d.transaksiId === t.id)
      transDetails.forEach(d => {
        const produk = produkList.find(p => p.id === d.produkId)
        if (produk) {
          totalHpp += (produk.hargaBeli || 0) * d.jumlah
        }
      })
    })

    // Calculate from pembelian
    filteredPembelian.forEach(p => {
      totalPembelian += p.grandTotal || 0
    })

    // Calculate from cash flow
    filteredCashFlow.forEach(c => {
      if (c.tipe === 'MASUK' && c.kategori !== 'Penjualan') {
        totalPendapatanLain += c.jumlah || 0
      } else if (c.tipe === 'KELUAR') {
        totalPengeluaran += c.jumlah || 0
      }
    })

    // Calculate laba kotor and laba bersih
    const labaKotor = totalPenjualan - totalHpp
    const labaBersih = labaKotor + totalPendapatanLain - totalPengeluaran

    // Group by date for daily report
    const dailyReport: Record<string, { tanggal: string; penjualan: number; hpp: number; labaKotor: number; transaksi: number }> = {}
    
    filteredTransaksi.forEach(t => {
      const date = t.tanggal.split('T')[0]
      if (!dailyReport[date]) {
        dailyReport[date] = { tanggal: date, penjualan: 0, hpp: 0, labaKotor: 0, transaksi: 0 }
      }
      dailyReport[date].penjualan += t.total || 0
      dailyReport[date].transaksi += 1

      const transDetails = details.filter(d => d.transaksiId === t.id)
      transDetails.forEach(d => {
        const produk = produkList.find(p => p.id === d.produkId)
        if (produk) {
          dailyReport[date].hpp += (produk.hargaBeli || 0) * d.jumlah
        }
      })
      dailyReport[date].labaKotor = dailyReport[date].penjualan - dailyReport[date].hpp
    })

    // Group by product
    const productReport: Record<string, { produkId: string; nama: string; qty: number; penjualan: number; hpp: number; laba: number }> = {}
    
    filteredTransaksi.forEach(t => {
      const transDetails = details.filter(d => d.transaksiId === t.id)
      transDetails.forEach(d => {
        const produk = produkList.find(p => p.id === d.produkId)
        if (!produk) return

        if (!productReport[d.produkId]) {
          productReport[d.produkId] = {
            produkId: d.produkId,
            nama: produk.nama,
            qty: 0,
            penjualan: 0,
            hpp: 0,
            laba: 0
          }
        }
        productReport[d.produkId].qty += d.jumlah
        productReport[d.produkId].penjualan += d.subtotal
        productReport[d.produkId].hpp += (produk.hargaBeli || 0) * d.jumlah
        productReport[d.produkId].laba = productReport[d.produkId].penjualan - productReport[d.produkId].hpp
      })
    })

    // Sort by profit
    const sortedProductReport = Object.values(productReport).sort((a, b) => b.laba - a.laba)

    return NextResponse.json({
      summary: {
        totalPenjualan,
        totalHpp,
        labaKotor,
        totalPembelian,
        totalPendapatanLain,
        totalPengeluaran,
        labaBersih
      },
      daily: Object.values(dailyReport).sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      byProduct: sortedProductReport
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
