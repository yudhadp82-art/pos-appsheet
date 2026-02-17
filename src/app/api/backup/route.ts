import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  Timestamp,
  query
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

// Export all data
export async function GET() {
  try {
    const [pelanggan, produk, transaksi, hutang, cashFlow] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.PELANGGAN))),
      getDocs(query(collection(db, COLLECTIONS.PRODUK))),
      getDocs(query(collection(db, COLLECTIONS.TRANSAKSI))),
      getDocs(query(collection(db, COLLECTIONS.HUTANG))),
      getDocs(query(collection(db, COLLECTIONS.CASH_FLOW)))
    ])

    const [detailTransaksi, pembayaranHutang] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.DETAIL_TRANSAKSI))),
      getDocs(query(collection(db, COLLECTIONS.PEMBAYARAN_HUTANG)))
    ])

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      pelanggan: pelanggan.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
      produk: produk.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
      transaksi: transaksi.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
      detailTransaksi: detailTransaksi.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
      hutang: hutang.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
      pembayaranHutang: pembayaranHutang.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
      cashFlow: cashFlow.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Import/restore data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const batch = writeBatch(db)

    // Clear and restore each collection
    const collections = [
      { name: COLLECTIONS.PELANGGAN, data: body.pelanggan },
      { name: COLLECTIONS.PRODUK, data: body.produk },
      { name: COLLECTIONS.TRANSAKSI, data: body.transaksi },
      { name: COLLECTIONS.DETAIL_TRANSAKSI, data: body.detailTransaksi },
      { name: COLLECTIONS.HUTANG, data: body.hutang },
      { name: COLLECTIONS.PEMBAYARAN_HUTANG, data: body.pembayaranHutang },
      { name: COLLECTIONS.CASH_FLOW, data: body.cashFlow }
    ]

    for (const col of collections) {
      if (col.data && Array.isArray(col.data)) {
        // Clear existing
        const existing = await getDocs(collection(db, col.name))
        for (const docSnap of existing.docs) {
          batch.delete(docSnap.ref)
        }

        // Add new
        for (const item of col.data) {
          const { id, ...data } = item
          const docRef = doc(db, col.name, id)
          
          // Convert dates
          const firestoreData = { ...data }
          for (const key in firestoreData) {
            if (typeof firestoreData[key] === 'string' && firestoreData[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
              firestoreData[key] = Timestamp.fromDate(new Date(firestoreData[key]))
            }
          }
          
          batch.set(docRef, firestoreData)
        }
      }
    }

    await batch.commit()

    return NextResponse.json({ success: true, message: 'Data restored successfully' })
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
