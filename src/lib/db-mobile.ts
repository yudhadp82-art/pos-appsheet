import Dexie, { type EntityTable } from 'dexie'

// Types
export interface Pelanggan {
  id: string
  nama: string
  alamat?: string
  telepon?: string
  email?: string
  createdAt: Date
}

export interface Produk {
  id: string
  nama: string
  barcode: string
  hargaBeli: number
  hargaJual: number
  stok: number
  kategori?: string
  deskripsi?: string
  createdAt: Date
}

export interface Transaksi {
  id: string
  noNota: string
  pelangganId?: string
  tanggal: Date
  subtotal: number
  diskon: number
  pajak: number
  total: number
  bayar: number
  kembalian: number
  metodePembayaran: string
  status: string
  createdAt: Date
}

export interface DetailTransaksi {
  id: string
  transaksiId: string
  produkId: string
  jumlah: number
  harga: number
  subtotal: number
  createdAt: Date
}

export interface Hutang {
  id: string
  pelangganId: string
  transaksiId: string
  totalHutang: number
  sisaHutang: number
  jatuhTempo?: Date
  status: string
  createdAt: Date
}

export interface PembayaranHutang {
  id: string
  hutangId: string
  jumlah: number
  tanggal: Date
  keterangan?: string
  createdAt: Date
}

export interface CashFlow {
  id: string
  tipe: string
  kategori: string
  jumlah: number
  keterangan?: string
  tanggal: Date
  createdAt: Date
}

// Database
const db = new Dexie('POSAppSheetDB') as Dexie & {
  pelanggan: EntityTable<Pelanggan, 'id'>
  produk: EntityTable<Produk, 'id'>
  transaksi: EntityTable<Transaksi, 'id'>
  detailTransaksi: EntityTable<DetailTransaksi, 'id'>
  hutang: EntityTable<Hutang, 'id'>
  pembayaranHutang: EntityTable<PembayaranHutang, 'id'>
  cashFlow: EntityTable<CashFlow, 'id'>
}

db.version(1).stores({
  pelanggan: 'id, nama, telepon, email',
  produk: 'id, nama, barcode, kategori, hargaJual',
  transaksi: 'id, noNota, pelangganId, tanggal, status, metodePembayaran',
  detailTransaksi: 'id, transaksiId, produkId',
  hutang: 'id, pelangganId, transaksiId, status',
  pembayaranHutang: 'id, hutangId',
  cashFlow: 'id, tipe, kategori, tanggal'
})

// Helper functions
export const generateId = () => crypto.randomUUID()
export const generateNoNota = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV${year}${month}${day}${random}`
}
export const generateBarcode = () => {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${timestamp}${random}`
}

export default db
