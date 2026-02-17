// API Types
export interface Pelanggan {
  id: string
  noPelanggan: string  // Nomor ID Pelanggan (format bebas)
  nama: string
  alamat?: string | null
  telepon?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
}

export interface Supplier {
  id: string
  kode: string
  nama: string
  alamat?: string | null
  telepon?: string | null
  email?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
}

export interface Produk {
  id: string
  nama: string
  barcode: string
  hargaBeli: number
  hargaJual: number
  stok: number
  stokMinimum: number  // Stok minimum untuk alert
  kategori?: string | null
  deskripsi?: string | null
  gambar?: string | null  // URL gambar produk
  satuan?: string | null  // Satuan produk (pcs, kg, liter, dll)
  supplierId?: string | null  // ID supplier utama
  createdAt: Date | string
  updatedAt?: Date | string
}

export interface Pembelian {
  id: string
  noFaktur: string
  supplierId: string
  tanggal: Date | string
  totalHarga: number
  biayaOngkir: number
  biayaLain: number
  grandTotal: number
  status: string  // LUNAS, HUTANG
  keterangan?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  supplier?: Supplier
  detailPembelian?: DetailPembelian[]
}

export interface DetailPembelian {
  id: string
  pembelianId: string
  produkId: string
  jumlah: number
  hargaBeli: number
  subtotal: number
  createdAt?: Date | string
  produk?: Produk
}

export interface KartuStok {
  id: string
  produkId: string
  tanggal: Date | string
  tipe: string  // MASUK, KELUAR
  referensi: string  // No faktur atau no nota
  jumlah: number
  stokSebelum: number
  stokSesudah: number
  keterangan?: string | null
  createdAt: Date | string
  produk?: Produk
}

export interface DetailTransaksi {
  id: string
  transaksiId: string
  produkId: string
  jumlah: number
  harga: number
  subtotal: number
  createdAt?: Date | string
  produk?: Produk
}

export interface Transaksi {
  id: string
  noNota: string
  pelangganId?: string | null
  tanggal: Date | string
  subtotal: number
  diskon: number
  pajak: number
  total: number
  bayar: number
  kembalian: number
  metodePembayaran: string
  status: string
  createdAt?: Date | string
  updatedAt?: Date | string
  pelanggan?: Pelanggan | null
  detailTransaksi?: (DetailTransaksi & { produk: Produk })[]
}

export interface PembayaranHutang {
  id: string
  hutangId: string
  jumlah: number
  tanggal: Date | string
  keterangan?: string | null
  createdAt?: Date | string
}

export interface Hutang {
  id: string
  pelangganId: string
  transaksiId: string
  totalHutang: number
  sisaHutang: number
  jatuhTempo?: Date | string | null
  status: string
  createdAt?: Date | string
  updatedAt?: Date | string
  pelanggan?: Pelanggan
  transaksi?: Transaksi
  pembayaran?: PembayaranHutang[]
}

export interface CashFlow {
  id: string
  tipe: string
  kategori: string
  jumlah: number
  keterangan?: string | null
  tanggal: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Collection names for Firebase
export const COLLECTIONS = {
  PELANGGAN: 'pelanggan',
  SUPPLIER: 'supplier',
  PRODUK: 'produk',
  TRANSAKSI: 'transaksi',
  DETAIL_TRANSAKSI: 'detailTransaksi',
  PEMBELIAN: 'pembelian',
  DETAIL_PEMBELIAN: 'detailPembelian',
  KARTU_STOK: 'kartuStok',
  HUTANG: 'hutang',
  PEMBAYARAN_HUTANG: 'pembayaranHutang',
  CASH_FLOW: 'cashFlow'
} as const

// API Helper Functions
const API_BASE = '/api'

async function apiGet(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API Error: ${res.status}`)
  }
  return res.json()
}

async function apiPost(endpoint: string, data: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API Error: ${res.status}`)
  }
  return res.json()
}

async function apiPut(endpoint: string, data: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API Error: ${res.status}`)
  }
  return res.json()
}

async function apiDelete(endpoint: string, data?: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API Error: ${res.status}`)
  }
  return res.json()
}

// Pelanggan API
export const pelangganApi = {
  getAll: () => apiGet('/data?type=pelanggan'),
  create: (data: Partial<Pelanggan>) => apiPost('/data', { type: COLLECTIONS.PELANGGAN, data }),
  update: (id: string, data: Partial<Pelanggan>) => apiPut('/data', { type: COLLECTIONS.PELANGGAN, id, data }),
  delete: (id: string) => apiDelete('/data', { type: COLLECTIONS.PELANGGAN, id })
}

// Produk API
export const produkApi = {
  getAll: () => apiGet('/data?type=produk'),
  create: (data: Partial<Produk>) => apiPost('/data', { type: COLLECTIONS.PRODUK, data }),
  update: (id: string, data: Partial<Produk>) => apiPut('/data', { type: COLLECTIONS.PRODUK, id, data }),
  delete: (id: string) => apiDelete('/data', { type: COLLECTIONS.PRODUK, id })
}

// Transaksi API
export const transaksiApi = {
  getAll: () => apiGet('/transaksi'),
  create: (data: { transaksi: Partial<Transaksi>; detailTransaksi: Partial<DetailTransaksi>[]; hutang?: Partial<Hutang>; cashFlow?: Partial<CashFlow> }) => 
    apiPost('/transaksi', data),
  delete: (id: string) => apiDelete('/data', { type: COLLECTIONS.TRANSAKSI, id })
}

// Hutang API
export const hutangApi = {
  getAll: () => apiGet('/hutang'),
  bayar: (hutangId: string, data: { pembayaran: Partial<PembayaranHutang>; sisaHutang: number; cashFlow?: Partial<CashFlow> }) => 
    apiPost('/hutang', { hutangId, ...data })
}

// CashFlow API
export const cashFlowApi = {
  getAll: () => apiGet('/data?type=cashFlow'),
  create: (data: Partial<CashFlow>) => apiPost('/data', { type: COLLECTIONS.CASH_FLOW, data }),
  delete: (id: string) => apiDelete('/data', { type: COLLECTIONS.CASH_FLOW, id })
}

// Backup API
export const backupApi = {
  export: () => apiGet('/backup'),
  import: (data: any) => apiPost('/backup', data)
}

// Supplier API
export const supplierApi = {
  getAll: () => apiGet('/data?type=supplier'),
  create: (data: Partial<Supplier>) => apiPost('/data', { type: COLLECTIONS.SUPPLIER, data }),
  update: (id: string, data: Partial<Supplier>) => apiPut('/data', { type: COLLECTIONS.SUPPLIER, id, data }),
  delete: (id: string) => apiDelete('/data', { type: COLLECTIONS.SUPPLIER, id })
}

// Pembelian API
export const pembelianApi = {
  getAll: () => apiGet('/pembelian'),
  create: (data: { pembelian: Partial<Pembelian>; detailPembelian: Partial<DetailPembelian>[]; cashFlow?: Partial<CashFlow> }) => 
    apiPost('/pembelian', data)
}

// KartuStok API
export const kartuStokApi = {
  getAll: () => apiGet('/data?type=kartuStok'),
  getByProduk: (produkId: string) => apiGet(`/kartu-stok?produkId=${produkId}`)
}

// Generate Barcode
export const generateBarcode = () => {
  return `BC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

// Generate ID
export const generateId = () => {
  return `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`
}

// Generate No Nota
export const generateNoNota = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `POS${year}${month}${day}${random}`
}
