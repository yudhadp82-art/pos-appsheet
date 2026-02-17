import { NextRequest, NextResponse } from 'next/server'
import { 
  getPelangganById, 
  updatePelanggan, 
  deletePelanggan 
} from '@/lib/db-firestore'

// GET pelanggan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pelanggan = await getPelangganById(id)
    if (!pelanggan) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(pelanggan)
  } catch (error) {
    console.error('Error getting pelanggan:', error)
    return NextResponse.json({ error: 'Gagal mengambil data pelanggan' }, { status: 500 })
  }
}

// PUT update pelanggan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    await updatePelanggan(id, {
      nama: data.nama,
      alamat: data.alamat || undefined,
      telepon: data.telepon || undefined,
      email: data.email || undefined,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating pelanggan:', error)
    return NextResponse.json({ error: 'Gagal mengupdate pelanggan' }, { status: 500 })
  }
}

// DELETE pelanggan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deletePelanggan(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pelanggan:', error)
    return NextResponse.json({ error: 'Gagal menghapus pelanggan' }, { status: 500 })
  }
}
