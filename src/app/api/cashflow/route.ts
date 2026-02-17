import { NextRequest, NextResponse } from 'next/server'
import { 
  getCashFlow, 
  addCashFlow, 
  deleteCashFlow 
} from '@/lib/db-firestore'

// GET all cash flow
export async function GET() {
  try {
    const cashFlow = await getCashFlow()
    return NextResponse.json(cashFlow)
  } catch (error) {
    console.error('Error getting cash flow:', error)
    return NextResponse.json({ error: 'Gagal mengambil data cash flow' }, { status: 500 })
  }
}

// POST create cash flow
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = await addCashFlow({
      tipe: data.tipe,
      kategori: data.kategori,
      jumlah: Number(data.jumlah) || 0,
      keterangan: data.keterangan || undefined,
      tanggal: new Date(),
    })
    return NextResponse.json({ id, ...data, createdAt: new Date() })
  } catch (error) {
    console.error('Error creating cash flow:', error)
    return NextResponse.json({ error: 'Gagal membuat cash flow' }, { status: 500 })
  }
}
