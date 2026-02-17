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
    const body = await request.json()
    const { pembelian, detailPembelian, cashFlow } = body

    console.log('=== PEMBELIAN API CALLED ===')
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Validation
    if (!pembelian) {
      console.error('Missing pembelian data')
      return NextResponse.json({ error: 'Missing pembelian data' }, { status: 400 })
    }

    if (!detailPembelian || detailPembelian.length === 0) {
      console.error('Missing detailPembelian')
      return NextResponse.json({ error: 'Missing detail pembelian' }, { status: 400 })
    }

    if (!pembelian.supplierId) {
      console.error('Missing supplierId')
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    console.log('Creating pembelian document...')
    
    const batch = writeBatch(db)
    const pembelianId = doc(collection(db, COLLECTIONS.PEMBELIAN)).id
    const pembelianRef = doc(db, COLLECTIONS.PEMBELIAN, pembelianId)

    // 1. Create pembelian document
    batch.set(pembelianRef, {
      id: pembelianId,
      noFaktur: pembelian.noFaktur || `PO-${Date.now()}`,
      supplierId: pembelian.supplierId,
      tanggal: Timestamp.now(),
      totalHarga: Number(pembelian.totalHarga) || 0,
      biayaOngkir: Number(pembelian.biayaOngkir) || 0,
      biayaLain: Number(pembelian.biayaLain) || 0,
      grandTotal: Number(pembelian.grandTotal) || 0,
      status: pembelian.status || 'LUNAS',
      keterangan: pembelian.keterangan || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    console.log('Processing detail items...')

    // 2. Process each detail item
    for (let i = 0; i < detailPembelian.length; i++) {
      const detail = detailPembelian[i]
      console.log(`Processing detail ${i + 1}:`, detail)

      if (!detail.produkId) {
        console.error('Missing produkId in detail:', detail)
        return NextResponse.json({ error: `Product ID is missing in item ${i + 1}` }, { status: 400 })
      }

      // Get current product
      const produkRef = doc(db, COLLECTIONS.PRODUK, detail.produkId)
      const produkDoc = await getDoc(produkRef)
      
      let currentStok = 0
      let newStok = Number(detail.jumlah) || 0

      if (produkDoc.exists()) {
        currentStok = Number(produkDoc.data()?.stok) || 0
        newStok = currentStok + (Number(detail.jumlah) || 0)
        
        console.log(`Updating product ${detail.produkId}: stok ${currentStok} -> ${newStok}`)
        batch.update(produkRef, {
          stok: newStok,
          hargaBeli: Number(detail.hargaBeli) || 0,
          updatedAt: Timestamp.now()
        })
      } else {
        console.log(`Creating new product: ${detail.produkId}`)
        batch.set(produkRef, {
          id: detail.produkId,
          nama: detail.produkNama || 'Unknown',
          barcode: `AUTO-${Date.now()}`,
          hargaBeli: Number(detail.hargaBeli) || 0,
          hargaJual: Math.round((Number(detail.hargaBeli) || 0) * 1.2),
          stok: Number(detail.jumlah) || 0,
          stokMinimum: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      }

      // Create detail pembelian
      const detailId = doc(collection(db, COLLECTIONS.DETAIL_PEMBELIAN)).id
      const detailRef = doc(db, COLLECTIONS.DETAIL_PEMBELIAN, detailId)
      batch.set(detailRef, {
        id: detailId,
        pembelianId: pembelianId,
        produkId: detail.produkId,
        jumlah: Number(detail.jumlah) || 0,
        hargaBeli: Number(detail.hargaBeli) || 0,
        subtotal: Number(detail.subtotal) || (Number(detail.hargaBeli) * Number(detail.jumlah)) || 0,
        createdAt: Timestamp.now()
      })

      // Create kartu stok
      const kartuStokId = doc(collection(db, COLLECTIONS.KARTU_STOK)).id
      const kartuStokRef = doc(db, COLLECTIONS.KARTU_STOK, kartuStokId)
      batch.set(kartuStokRef, {
        id: kartuStokId,
        produkId: detail.produkId,
        tanggal: Timestamp.now(),
        tipe: 'MASUK',
        referensi: pembelian.noFaktur || `PO-${Date.now()}`,
        jumlah: Number(detail.jumlah) || 0,
        stokSebelum: currentStok,
        stokSesudah: newStok,
        keterangan: 'Pembelian dari supplier',
        createdAt: Timestamp.now()
      })
    }

    // 3. Create cash flow if LUNAS
    if (pembelian.status === 'LUNAS' && pembelian.grandTotal > 0) {
      console.log('Creating cash flow entry...')
      const cashFlowId = doc(collection(db, COLLECTIONS.CASH_FLOW)).id
      const cashFlowRef = doc(db, COLLECTIONS.CASH_FLOW, cashFlowId)
      batch.set(cashFlowRef, {
        id: cashFlowId,
        tipe: 'KELUAR',
        kategori: 'Pembelian Stok',
        jumlah: Number(pembelian.grandTotal) || 0,
        keterangan: `Pembelian ${pembelian.noFaktur || ''}`,
        tanggal: Timestamp.now(),
        createdAt: Timestamp.now()
      })
    }

    console.log('Committing batch...')
    await batch.commit()
    console.log('=== PEMBELIAN SAVED SUCCESSFULLY ===')

    return NextResponse.json({ 
      success: true, 
      id: pembelianId,
      noFaktur: pembelian.noFaktur 
    })

  } catch (error: any) {
    console.error('=== PEMBELIAN ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create pembelian',
      code: error.code,
      details: error.toString()
    }, { status: 500 })
  }
}
