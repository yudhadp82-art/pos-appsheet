import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
  addDoc
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

// Get all hutang with relations
export async function GET(request: NextRequest) {
  try {
    const [hutangSnapshot, pembayaranSnapshot, pelangganSnapshot, transaksiSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.HUTANG))),
      getDocs(query(collection(db, COLLECTIONS.PEMBAYARAN_HUTANG), orderBy('tanggal', 'desc'))),
      getDocs(query(collection(db, COLLECTIONS.PELANGGAN))),
      getDocs(query(collection(db, COLLECTIONS.TRANSAKSI)))
    ])

    const hutangList = hutangSnapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const pembayaranList = pembayaranSnapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const pelangganList = pelangganSnapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
    const transaksiList = transaksiSnapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))

    return NextResponse.json({
      hutang: hutangList,
      pembayaranHutang: pembayaranList,
      pelanggan: pelangganList,
      transaksi: transaksiList
    })
  } catch (error: any) {
    console.error('GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Pay hutang
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hutangId, pembayaran, cashFlow } = body

    const batch = writeBatch(db)

    // 1. Create pembayaran hutang
    const pembayaranRef = doc(collection(db, COLLECTIONS.PEMBAYARAN_HUTANG))
    batch.set(pembayaranRef, {
      ...pembayaran,
      hutangId,
      tanggal: Timestamp.fromDate(new Date(pembayaran.tanggal || new Date())),
      createdAt: Timestamp.now()
    })

    // 2. Update hutang (sisa hutang dan status)
    const hutangRef = doc(db, COLLECTIONS.HUTANG, hutangId)
    batch.update(hutangRef, {
      sisaHutang: pembayaran.sisaHutang,
      status: pembayaran.sisaHutang <= 0 ? 'LUNAS' : 'BELUM_LUNAS',
      updatedAt: Timestamp.now()
    })

    // 3. Create cash flow
    if (cashFlow) {
      const cashFlowRef = doc(collection(db, COLLECTIONS.CASH_FLOW))
      batch.set(cashFlowRef, {
        ...cashFlow,
        tanggal: Timestamp.fromDate(new Date(cashFlow.tanggal || new Date())),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    }

    await batch.commit()

    return NextResponse.json({ success: true, pembayaranId: pembayaranRef.id })
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
