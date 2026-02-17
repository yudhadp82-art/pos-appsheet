import { NextRequest, NextResponse } from 'next/server'
import { 
  getHutangById,
  updateHutang,
  addPembayaranHutang,
  addCashFlow
} from '@/lib/db-firestore'

// GET hutang by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const hutang = await getHutangById(id)
    if (!hutang) {
      return NextResponse.json({ error: 'Hutang tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(hutang)
  } catch (error) {
    console.error('Error getting hutang:', error)
    return NextResponse.json({ error: 'Gagal mengambil data hutang' }, { status: 500 })
  }
}

// PUT - Bayar hutang
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const hutang = await getHutangById(id)
    if (!hutang) {
      return NextResponse.json({ error: 'Hutang tidak ditemukan' }, { status: 404 })
    }
    
    const jumlahBayar = Number(data.jumlah) || 0
    const sisaBaru = hutang.sisaHutang - jumlahBayar
    const statusBaru = sisaBaru <= 0 ? 'LUNAS' : 'BELUM_LUNAS'
    
    // Add pembayaran record
    await addPembayaranHutang({
      hutangId: id,
      jumlah: jumlahBayar,
      tanggal: new Date(),
      keterangan: data.keterangan || undefined,
    })
    
    // Update hutang
    await updateHutang(id, {
      sisaHutang: Math.max(0, sisaBaru),
      status: statusBaru,
    })
    
    // Add cash flow
    await addCashFlow({
      tipe: 'MASUK',
      kategori: 'Pembayaran Hutang',
      jumlah: jumlahBayar,
      keterangan: `Pembayaran hutang ${data.keterangan || ''}`,
      tanggal: new Date(),
    })
    
    return NextResponse.json({ 
      success: true, 
      sisaHutang: Math.max(0, sisaBaru),
      status: statusBaru
    })
  } catch (error) {
    console.error('Error updating hutang:', error)
    return NextResponse.json({ error: 'Gagal mengupdate hutang' }, { status: 500 })
  }
}
