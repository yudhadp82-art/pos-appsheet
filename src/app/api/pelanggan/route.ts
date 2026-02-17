import { NextRequest, NextResponse } from 'next/server'
import { 
  getPelanggan, 
  addPelanggan, 
  updatePelanggan, 
  deletePelanggan,
  generateId
} from '@/lib/db-firestore'

// GET all pelanggan
export async function GET() {
  try {
    const pelanggan = await getPelanggan()
    return NextResponse.json(pelanggan)
  } catch (error) {
    console.error('Error getting pelanggan:', error)
    return NextResponse.json({ error: 'Gagal mengambil data pelanggan' }, { status: 500 })
  }
}

// POST create pelanggan
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = await addPelanggan({
      nama: data.nama,
      alamat: data.alamat || undefined,
      telepon: data.telepon || undefined,
      email: data.email || undefined,
    })
    return NextResponse.json({ id, ...data, createdAt: new Date() })
  } catch (error) {
    console.error('Error creating pelanggan:', error)
    return NextResponse.json({ error: 'Gagal membuat pelanggan' }, { status: 500 })
  }
}
