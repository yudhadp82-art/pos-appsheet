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
  Timestamp,
  writeBatch,
  increment
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

// Create transaksi with details and update stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaksi, detailTransaksi, hutang, cashFlow } = body

    const batch = writeBatch(db)

    // 1. Create transaksi
    const transaksiRef = doc(collection(db, COLLECTIONS.TRANSAKSI))
    const transaksiData = {
      ...transaksi,
      tanggal: Timestamp.fromDate(new Date(transaksi.tanggal || new Date())),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    batch.set(transaksiRef, transaksiData)

    // 2. Create detail transaksi and update stock
    for (const detail of detailTransaksi) {
      const detailRef = doc(collection(db, COLLECTIONS.DETAIL_TRANSAKSI))
      batch.set(detailRef, {
        ...detail,
        transaksiId: transaksiRef.id,
        createdAt: Timestamp.now()
      })

      // Update stock
      const produkRef = doc(db, COLLECTIONS.PRODUK, detail.produkId)
      batch.update(produkRef, {
        stok: increment(-detail.jumlah),
        updatedAt: Timestamp.now()
      })
    }

    // 3. Create hutang if needed
    if (hutang) {
      const hutangRef = doc(collection(db, COLLECTIONS.HUTANG))
      batch.set(hutangRef, {
        ...hutang,
        transaksiId: transaksiRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    }

    // 4. Create cash flow
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

    return NextResponse.json({
      success: true,
      transaksiId: transaksiRef.id,
      transaksi: { id: transaksiRef.id, ...transaksiData }
    })
  } catch (error: any) {
    console.error('Transaction error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get transaksi with details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get single transaksi with details
      const transaksiDoc = await getDocs(query(collection(db, COLLECTIONS.TRANSAKSI)))
      const transaksi = transaksiDoc.docs.find(d => d.id === id)
      
      if (!transaksi) {
        return NextResponse.json({ error: 'Transaksi not found' }, { status: 404 })
      }

      const detailSnapshot = await getDocs(query(collection(db, COLLECTIONS.DETAIL_TRANSAKSI)))
      const details = detailSnapshot.docs
        .filter(d => d.data().transaksiId === id)
        .map(d => convertTimestamp({ id: d.id, ...d.data() }))

      return NextResponse.json({
        transaksi: convertTimestamp({ id: transaksi.id, ...transaksi.data() }),
        detailTransaksi: details
      })
    }

    // Get all transaksi
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.TRANSAKSI), orderBy('tanggal', 'desc')))
    const transaksiList = snapshot.docs.map(d => convertTimestamp({ id: d.id, ...d.data() }))

    return NextResponse.json({ transaksi: transaksiList })
  } catch (error: any) {
    console.error('GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
