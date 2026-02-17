import { NextRequest, NextResponse } from 'next/server'
import { 
  getTransaksiById, 
  deleteTransaksi 
} from '@/lib/db-firestore'

// GET transaksi by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaksi = await getTransaksiById(id)
    if (!transaksi) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(transaksi)
  } catch (error) {
    console.error('Error getting transaksi:', error)
    return NextResponse.json({ error: 'Gagal mengambil data transaksi' }, { status: 500 })
  }
}

// DELETE transaksi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteTransaksi(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaksi:', error)
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 })
  }
}
