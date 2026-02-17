import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  doc,
  Timestamp,
  writeBatch,
  getDoc
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

// GET - Get all pembelian with details
export async function GET() {
  try {
    const [pembelianSnapshot, supplierSnapshot, detailSnapshot, produkSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.PEMBELIAN)),
      getDocs(collection(db, COLLECTIONS.SUPPLIER)),
      getDocs(collection(db, COLLECTIONS.DETAIL_PEMBELIAN)),
      getDocs(collection(db, COLLECTIONS.PRODUK))
    ])

    const pembelianData = pembelianSnapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() }))
    const suppliers = supplierSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const details = detailSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    const produkList = produkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Enrich pembelian data
    const enrichedPembelian = pembelianData.map(p => {
      const supplier = suppliers.find(s => s.id === p.supplierId)
      const pembelianDetails = details
        .filter(d => d.pembelianId === p.id)
        .map(d => {
          const produk = produkList.find(p => p.id === d.produkId)
          return { ...d, produk }
        })
      return { ...p, supplier, detailPembelian: pembelianDetails }
    })

    return NextResponse.json(enrichedPembelian)
  } catch (error: any) {
    console.error('Error fetching pembelian:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new pembelian with details
export async function POST(request: NextRequest) {
  try {
    const { pembelian, detailPembelian, cashFlow } = await request.json()

    const batch = writeBatch(db)
    const now = new Date().toISOString()

    // 1. Create pembelian document
    const pembelianRef = doc(collection(db, COLLECTIONS.PEMBELIAN))
    batch.set(pembelianRef, {
      ...pembelian,
      id: pembelianRef.id,
      tanggal: Timestamp.fromDate(new Date(pembelian.tanggal || new Date())),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    // 2. Create detail pembelian and update stock
    for (const detail of detailPembelian) {
      const detailRef = doc(collection(db, COLLECTIONS.DETAIL_PEMBELIAN))
      batch.set(detailRef, {
        ...detail,
        id: detailRef.id,
        pembelianId: pembelianRef.id,
        createdAt: Timestamp.now()
      })

      // Get current product stock
      const produkRef = doc(db, COLLECTIONS.PRODUK, detail.produkId)
      const produkDoc = await getDoc(produkRef)
      const currentStok = produkDoc.data()?.stok || 0
      const newStok = currentStok + detail.jumlah

      // Update product stock and harga beli
      batch.update(produkRef, {
        stok: newStok,
        hargaBeli: detail.hargaBeli,
        updatedAt: Timestamp.now()
      })

      // Create kartu stok entry
      const kartuStokRef = doc(collection(db, COLLECTIONS.KARTU_STOK))
      batch.set(kartuStokRef, {
        id: kartuStokRef.id,
        produkId: detail.produkId,
        tanggal: Timestamp.now(),
        tipe: 'MASUK',
        referensi: pembelian.noFaktur,
        jumlah: detail.jumlah,
        stokSebelum: currentStok,
        stokSesudah: newStok,
        keterangan: 'Pembelian dari supplier',
        createdAt: Timestamp.now()
      })
    }

    // 3. Create cash flow if payment is cash
    if (cashFlow && pembelian.status === 'LUNAS') {
      const cashFlowRef = doc(collection(db, COLLECTIONS.CASH_FLOW))
      batch.set(cashFlowRef, {
        id: cashFlowRef.id,
        ...cashFlow,
        tanggal: Timestamp.now(),
        createdAt: Timestamp.now()
      })
    }

    await batch.commit()

    return NextResponse.json({ id: pembelianRef.id, success: true })
  } catch (error: any) {
    console.error('Error creating pembelian:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
