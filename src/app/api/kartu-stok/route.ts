import { NextRequest, NextResponse } from 'next/server'
import {
  collection,
  getDocs,
  query,
  orderBy,
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

// GET - Get kartu stok with optional filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const produkId = searchParams.get('produkId')

    const [kartuStokSnapshot, produkSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.KARTU_STOK), orderBy('tanggal', 'desc'))),
      getDocs(collection(db, COLLECTIONS.PRODUK))
    ])

    const kartuStokData = kartuStokSnapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() }))
    const produkList = produkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Enrich with produk data
    let enrichedData = kartuStokData.map((k: any) => {
      const produk = produkList.find(p => p.id === k.produkId)
      return { ...k, produk }
    })

    // Filter by produkId if provided
    if (produkId) {
      enrichedData = enrichedData.filter((k: any) => k.produkId === produkId)
    }

    return NextResponse.json(enrichedData)
  } catch (error: any) {
    console.error('Error fetching kartu stok:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
