import { NextRequest, NextResponse } from 'next/server'
import { deleteCashFlow } from '@/lib/db-firestore'

// DELETE cash flow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteCashFlow(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cash flow:', error)
    return NextResponse.json({ error: 'Gagal menghapus cash flow' }, { status: 500 })
  }
}
