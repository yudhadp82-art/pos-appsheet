import { NextRequest, NextResponse } from 'next/server'
import { 
  getProduk, 
  addProduk, 
  generateBarcode 
} from '@/lib/db-firestore'

// GET all produk
export async function GET() {
  try {
    const produk = await getProduk()
    return NextResponse.json(produk)
  } catch (error) {
    console.error('Error getting produk:', error)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }
}

// POST create produk
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const barcode = data.barcode || generateBarcode()
    const id = await addProduk({
      nama: data.nama,
      barcode: barcode,
      hargaBeli: Number(data.hargaBeli) || 0,
      hargaJual: Number(data.hargaJual) || 0,
      stok: Number(data.stok) || 0,
      kategori: data.kategori || undefined,
      deskripsi: data.deskripsi || undefined,
    })
    return NextResponse.json({ id, barcode, ...data, createdAt: new Date() })
  } catch (error) {
    console.error('Error creating produk:', error)
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 })
  }
}
