import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db, COLLECTIONS } from '@/lib/firebase'

// Helper to convert Firestore timestamps
const convertTimestamp = (data: any) => {
  const converted = { ...data }
  for (const key in converted) {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString()
    }
  }
  return converted
}

// GET - Fetch all data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      // Return all data
      const [pelanggan, produk, transaksi, hutang, cashFlow] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.PELANGGAN))),
        getDocs(query(collection(db, COLLECTIONS.PRODUK))),
        getDocs(query(collection(db, COLLECTIONS.TRANSAKSI), orderBy('tanggal', 'desc'))),
        getDocs(query(collection(db, COLLECTIONS.HUTANG))),
        getDocs(query(collection(db, COLLECTIONS.CASH_FLOW), orderBy('tanggal', 'desc')))
      ])

      const [detailTransaksi, pembayaranHutang] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.DETAIL_TRANSAKSI))),
        getDocs(query(collection(db, COLLECTIONS.PEMBAYARAN_HUTANG)))
      ])

      return NextResponse.json({
        pelanggan: pelanggan.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
        produk: produk.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
        transaksi: transaksi.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
        detailTransaksi: detailTransaksi.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
        hutang: hutang.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
        pembayaranHutang: pembayaranHutang.docs.map(d => convertTimestamp({ id: d.id, ...d.data() })),
        cashFlow: cashFlow.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
      })
    }

    // Fetch specific collection
    const collectionRef = collection(db, type)
    const snapshot = await getDocs(query(collectionRef))
    const data = snapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    // Convert dates to Firestore timestamps
    const firestoreData = { ...data }
    for (const key in firestoreData) {
      if (typeof firestoreData[key] === 'string' && firestoreData[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
        firestoreData[key] = Timestamp.fromDate(new Date(firestoreData[key]))
      }
    }

    const docRef = await addDoc(collection(db, type), firestoreData)
    return NextResponse.json({ id: docRef.id, ...firestoreData })
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update document
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, data } = body

    if (!type || !id || !data) {
      return NextResponse.json({ error: 'Missing type, id, or data' }, { status: 400 })
    }

    // Convert dates to Firestore timestamps
    const firestoreData = { ...data }
    for (const key in firestoreData) {
      if (typeof firestoreData[key] === 'string' && firestoreData[key].match(/^\d{4}-\d{2}-\d{2}T/)) {
        firestoreData[key] = Timestamp.fromDate(new Date(firestoreData[key]))
      }
    }

    await updateDoc(doc(db, type, id), firestoreData)
    return NextResponse.json({ id, ...firestoreData })
  } catch (error: any) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id } = body

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    await deleteDoc(doc(db, type, id))
    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
