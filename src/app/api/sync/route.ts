import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db, COLLECTIONS } from '@/lib/firebase'

const convertTimestamp = (data: any) => {
  const converted = { ...data }
  for (const key in converted) {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString()
    }
  }
  return converted
}

// GET all data for sync
export async function GET() {
  try {
    const [pelangganSnap, supplierSnap, produkSnap, transaksiSnap, detailTransaksiSnap, hutangSnap, pembayaranHutangSnap, cashFlowSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.PELANGGAN)),
      getDocs(collection(db, COLLECTIONS.SUPPLIER)),
      getDocs(collection(db, COLLECTIONS.PRODUK)),
      getDocs(collection(db, COLLECTIONS.TRANSAKSI)),
      getDocs(collection(db, COLLECTIONS.DETAIL_TRANSAKSI)),
      getDocs(collection(db, COLLECTIONS.HUTANG)),
      getDocs(collection(db, COLLECTIONS.PEMBAYARAN_HUTANG)),
      getDocs(collection(db, COLLECTIONS.CASH_FLOW))
    ])

    const pelanggan = pelangganSnap.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const supplier = supplierSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const produk = produkSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const transaksi = transaksiSnap.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const detailTransaksi = detailTransaksiSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const hutang = hutangSnap.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const pembayaranHutang = pembayaranHutangSnap.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const cashFlow = cashFlowSnap.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    
    return NextResponse.json({
      pelanggan,
      supplier,
      produk,
      transaksi,
      detailTransaksi,
      hutang,
      pembayaranHutang,
      cashFlow,
      syncTime: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengambil data sync' }, { status: 500 })
  }
}
