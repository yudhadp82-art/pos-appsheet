import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-firestore'
import { generateId } from '@/lib/api'

// GET - Get all pembelian with details
export async function GET() {
  try {
    const pembelianSnapshot = await db.collection('pembelian').orderBy('tanggal', 'desc').get()
    const pembelianData = pembelianSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all suppliers
    const supplierSnapshot = await db.collection('supplier').get()
    const suppliers = supplierSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all detail pembelian
    const detailSnapshot = await db.collection('detailPembelian').get()
    const details = detailSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all produk
    const produkSnapshot = await db.collection('produk').get()
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
  } catch (error) {
    console.error('Error fetching pembelian:', error)
    return NextResponse.json({ error: 'Failed to fetch pembelian' }, { status: 500 })
  }
}

// POST - Create new pembelian with details
export async function POST(request: NextRequest) {
  try {
    const { pembelian, detailPembelian, cashFlow } = await request.json()

    const pembelianId = generateId()
    const now = new Date().toISOString()

    // Create pembelian document
    await db.collection('pembelian').doc(pembelianId).set({
      ...pembelian,
      id: pembelianId,
      createdAt: now,
      updatedAt: now
    })

    // Create detail pembelian and update stock
    for (const detail of detailPembelian) {
      const detailId = generateId()
      await db.collection('detailPembelian').doc(detailId).set({
        ...detail,
        id: detailId,
        pembelianId,
        createdAt: now
      })

      // Get current product stock
      const produkRef = db.collection('produk').doc(detail.produkId)
      const produkDoc = await produkRef.get()
      const currentStok = produkDoc.data()?.stok || 0
      const newStok = currentStok + detail.jumlah

      // Update product stock and harga beli
      await produkRef.update({
        stok: newStok,
        hargaBeli: detail.hargaBeli,
        updatedAt: now
      })

      // Create kartu stok entry
      const kartuStokId = generateId()
      await db.collection('kartuStok').doc(kartuStokId).set({
        id: kartuStokId,
        produkId: detail.produkId,
        tanggal: now,
        tipe: 'MASUK',
        referensi: pembelian.noFaktur,
        jumlah: detail.jumlah,
        stokSebelum: currentStok,
        stokSesudah: newStok,
        keterangan: 'Pembelian dari supplier',
        createdAt: now
      })
    }

    // Create cash flow if payment is cash
    if (cashFlow && pembelian.status === 'LUNAS') {
      const cashFlowId = generateId()
      await db.collection('cashFlow').doc(cashFlowId).set({
        id: cashFlowId,
        ...cashFlow,
        createdAt: now
      })
    }

    return NextResponse.json({ id: pembelianId, success: true })
  } catch (error) {
    console.error('Error creating pembelian:', error)
    return NextResponse.json({ error: 'Failed to create pembelian' }, { status: 500 })
  }
}
