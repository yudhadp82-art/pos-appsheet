import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-firestore'

// GET - Get kartu stok with optional filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const produkId = searchParams.get('produkId')

    let query = db.collection('kartuStok')
    
    const kartuStokSnapshot = await query.orderBy('tanggal', 'desc').get()
    const kartuStokData = kartuStokSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get all produk
    const produkSnapshot = await db.collection('produk').get()
    const produkList = produkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Enrich with produk data
    let enrichedData = kartuStokData.map(k => {
      const produk = produkList.find(p => p.id === k.produkId)
      return { ...k, produk }
    })

    // Filter by produkId if provided
    if (produkId) {
      enrichedData = enrichedData.filter(k => k.produkId === produkId)
    }

    return NextResponse.json(enrichedData)
  } catch (error) {
    console.error('Error fetching kartu stok:', error)
    return NextResponse.json({ error: 'Failed to fetch kartu stok' }, { status: 500 })
  }
}
