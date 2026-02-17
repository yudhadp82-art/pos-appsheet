import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all data for sync
export async function GET() {
  try {
    const [pelanggan, produk, transaksi, hutang, cashFlow] = await Promise.all([
      prisma.pelanggan.findMany(),
      prisma.produk.findMany(),
      prisma.transaksi.findMany({
        include: {
          detailTransaksi: true
        }
      }),
      prisma.hutang.findMany({
        include: {
          pembayaran: true
        }
      }),
      prisma.cashFlow.findMany()
    ])
    
    return NextResponse.json({
      pelanggan,
      produk,
      transaksi,
      hutang,
      cashFlow,
      syncTime: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data sync' }, { status: 500 })
  }
}
