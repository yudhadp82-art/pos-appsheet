import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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

// Helper to safely get collection data
const safeGetCollection = async (collectionName: string) => {
  try {
    const snapshot = await getDocs(collection(db, collectionName))
    return snapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error)
    return []
  }
}

// GET - Fetch all data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type) {
      // Return all data - use safe method to handle non-existent collections
      const [pelanggan, supplier, produk, transaksi, detailTransaksi, hutang, pembayaranHutang, cashFlow, pembelian, detailPembelian, kartuStok] = await Promise.all([
        safeGetCollection(COLLECTIONS.PELANGGAN),
        safeGetCollection(COLLECTIONS.SUPPLIER),
        safeGetCollection(COLLECTIONS.PRODUK),
        safeGetCollection(COLLECTIONS.TRANSAKSI),
        safeGetCollection(COLLECTIONS.DETAIL_TRANSAKSI),
        safeGetCollection(COLLECTIONS.HUTANG),
        safeGetCollection(COLLECTIONS.PEMBAYARAN_HUTANG),
        safeGetCollection(COLLECTIONS.CASH_FLOW),
        safeGetCollection(COLLECTIONS.PEMBELIAN),
        safeGetCollection(COLLECTIONS.DETAIL_PEMBELIAN),
        safeGetCollection(COLLECTIONS.KARTU_STOK)
      ])

      return NextResponse.json({
        pelanggan,
        supplier,
        produk,
        transaksi,
        detailTransaksi,
        hutang,
        pembayaranHutang,
        cashFlow,
        pembelian,
        detailPembelian,
        kartuStok
      })
    }

    // Fetch specific collection
    const data = await safeGetCollection(type)
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

    console.log('POST request:', { type, data })

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
    console.log('Document created:', docRef.id)
    
    return NextResponse.json({ id: docRef.id, ...firestoreData })
  } catch (error: any) {
    console.error('POST error:', error)
    return NextResponse.json({ error: error.message, details: error.toString() }, { status: 500 })
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
