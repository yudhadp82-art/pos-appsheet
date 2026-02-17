import { NextRequest, NextResponse } from 'next/server'
import { 
  getProdukById, 
  updateProduk, 
  deleteProduk 
} from '@/lib/db-firestore'

// GET produk by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const produk = await getProdukById(id)
    if (!produk) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(produk)
  } catch (error) {
    console.error('Error getting produk:', error)
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 })
  }
}

// PUT update produk
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    await updateProduk(id, {
      nama: data.nama,
      hargaBeli: Number(data.hargaBeli),
      hargaJual: Number(data.hargaJual),
      stok: Number(data.stok),
      kategori: data.kategori || undefined,
      deskripsi: data.deskripsi || undefined,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating produk:', error)
    return NextResponse.json({ error: 'Gagal mengupdate produk' }, { status: 500 })
  }
}

// DELETE produk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteProduk(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting produk:', error)
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 })
  }
}
