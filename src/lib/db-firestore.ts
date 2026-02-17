import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db, COLLECTIONS } from './firebase'

// Types
export interface Pelanggan {
  id: string
  nama: string
  alamat?: string
  telepon?: string
  email?: string
  createdAt: Date
  updatedAt?: Date
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
  updatedAt?: Date
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
  updatedAt?: Date
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
  updatedAt?: Date
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
  updatedAt?: Date
}

// Helper functions
export const generateId = (): string => {
  return doc(collection(db, '_')).id
}

export const generateNoNota = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `POS${year}${month}${day}${random}`
}

export const generateBarcode = (): string => {
  return Math.random().toString().substring(2, 14)
}

// Date conversion helpers
const dateToTimestamp = (date: Date | string | undefined): Timestamp | undefined => {
  if (!date) return undefined
  const d = new Date(date)
  return Timestamp.fromDate(d)
}

const timestampToDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date()
  if (timestamp instanceof Date) return timestamp
  return timestamp.toDate()
}

// =====================
// PELANGGAN CRUD
// =====================
export const pelangganCollection = collection(db, COLLECTIONS.PELANGGAN)

export const getPelanggan = async (): Promise<Pelanggan[]> => {
  const q = query(pelangganCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: timestampToDate(doc.data().createdAt as Timestamp),
    updatedAt: doc.data().updatedAt ? timestampToDate(doc.data().updatedAt as Timestamp) : undefined
  })) as Pelanggan[]
}

export const getPelangganById = async (id: string): Promise<Pelanggan | null> => {
  const docRef = doc(pelangganCollection, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return {
    ...snapshot.data(),
    id: snapshot.id,
    createdAt: timestampToDate(snapshot.data().createdAt as Timestamp),
    updatedAt: snapshot.data().updatedAt ? timestampToDate(snapshot.data().updatedAt as Timestamp) : undefined
  } as Pelanggan
}

export const addPelanggan = async (data: Omit<Pelanggan, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(pelangganCollection, {
    ...data,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export const updatePelanggan = async (id: string, data: Partial<Pelanggan>): Promise<void> => {
  const docRef = doc(pelangganCollection, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  })
}

export const deletePelanggan = async (id: string): Promise<void> => {
  const docRef = doc(pelangganCollection, id)
  await deleteDoc(docRef)
}

// =====================
// PRODUK CRUD
// =====================
export const produkCollection = collection(db, COLLECTIONS.PRODUK)

export const getProduk = async (): Promise<Produk[]> => {
  const q = query(produkCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: timestampToDate(doc.data().createdAt as Timestamp),
    updatedAt: doc.data().updatedAt ? timestampToDate(doc.data().updatedAt as Timestamp) : undefined
  })) as Produk[]
}

export const getProdukById = async (id: string): Promise<Produk | null> => {
  const docRef = doc(produkCollection, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return {
    ...snapshot.data(),
    id: snapshot.id,
    createdAt: timestampToDate(snapshot.data().createdAt as Timestamp),
    updatedAt: snapshot.data().updatedAt ? timestampToDate(snapshot.data().updatedAt as Timestamp) : undefined
  } as Produk
}

export const addProduk = async (data: Omit<Produk, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(produkCollection, {
    ...data,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export const updateProduk = async (id: string, data: Partial<Produk>): Promise<void> => {
  const docRef = doc(produkCollection, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  })
}

export const deleteProduk = async (id: string): Promise<void> => {
  const docRef = doc(produkCollection, id)
  await deleteDoc(docRef)
}

// =====================
// TRANSAKSI CRUD
// =====================
export const transaksiCollection = collection(db, COLLECTIONS.TRANSAKSI)

export const getTransaksi = async (): Promise<Transaksi[]> => {
  const q = query(transaksiCollection, orderBy('tanggal', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    tanggal: timestampToDate(doc.data().tanggal as Timestamp),
    createdAt: timestampToDate(doc.data().createdAt as Timestamp),
    updatedAt: doc.data().updatedAt ? timestampToDate(doc.data().updatedAt as Timestamp) : undefined
  })) as Transaksi[]
}

export const getTransaksiById = async (id: string): Promise<Transaksi | null> => {
  const docRef = doc(transaksiCollection, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return {
    ...snapshot.data(),
    id: snapshot.id,
    tanggal: timestampToDate(snapshot.data().tanggal as Timestamp),
    createdAt: timestampToDate(snapshot.data().createdAt as Timestamp),
    updatedAt: snapshot.data().updatedAt ? timestampToDate(snapshot.data().updatedAt as Timestamp) : undefined
  } as Transaksi
}

export const addTransaksi = async (data: Omit<Transaksi, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(transaksiCollection, {
    ...data,
    tanggal: dateToTimestamp(data.tanggal) || Timestamp.now(),
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export const updateTransaksi = async (id: string, data: Partial<Transaksi>): Promise<void> => {
  const docRef = doc(transaksiCollection, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  })
}

export const deleteTransaksi = async (id: string): Promise<void> => {
  const docRef = doc(transaksiCollection, id)
  await deleteDoc(docRef)
}

// =====================
// DETAIL TRANSAKSI CRUD
// =====================
export const detailTransaksiCollection = collection(db, COLLECTIONS.DETAIL_TRANSAKSI)

export const getDetailTransaksiByTransaksiId = async (transaksiId: string): Promise<DetailTransaksi[]> => {
  const q = query(detailTransaksiCollection, where('transaksiId', '==', transaksiId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: timestampToDate(doc.data().createdAt as Timestamp)
  })) as DetailTransaksi[]
}

export const addDetailTransaksi = async (data: Omit<DetailTransaksi, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(detailTransaksiCollection, {
    ...data,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export const addDetailTransaksiBatch = async (items: Omit<DetailTransaksi, 'id' | 'createdAt'>[]): Promise<void> => {
  const batch = writeBatch(db)
  items.forEach(item => {
    const docRef = doc(detailTransaksiCollection)
    batch.set(docRef, {
      ...item,
      createdAt: Timestamp.now()
    })
  })
  await batch.commit()
}

// =====================
// HUTANG CRUD
// =====================
export const hutangCollection = collection(db, COLLECTIONS.HUTANG)

export const getHutang = async (): Promise<Hutang[]> => {
  const q = query(hutangCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    jatuhTempo: doc.data().jatuhTempo ? timestampToDate(doc.data().jatuhTempo as Timestamp) : undefined,
    createdAt: timestampToDate(doc.data().createdAt as Timestamp),
    updatedAt: doc.data().updatedAt ? timestampToDate(doc.data().updatedAt as Timestamp) : undefined
  })) as Hutang[]
}

export const getHutangById = async (id: string): Promise<Hutang | null> => {
  const docRef = doc(hutangCollection, id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return {
    ...snapshot.data(),
    id: snapshot.id,
    jatuhTempo: snapshot.data().jatuhTempo ? timestampToDate(snapshot.data().jatuhTempo as Timestamp) : undefined,
    createdAt: timestampToDate(snapshot.data().createdAt as Timestamp),
    updatedAt: snapshot.data().updatedAt ? timestampToDate(snapshot.data().updatedAt as Timestamp) : undefined
  } as Hutang
}

export const addHutang = async (data: Omit<Hutang, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(hutangCollection, {
    ...data,
    jatuhTempo: data.jatuhTempo ? dateToTimestamp(data.jatuhTempo) : null,
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export const updateHutang = async (id: string, data: Partial<Hutang>): Promise<void> => {
  const docRef = doc(hutangCollection, id)
  await updateDoc(docRef, {
    ...data,
    jatuhTempo: data.jatuhTempo ? dateToTimestamp(data.jatuhTempo) : null,
    updatedAt: Timestamp.now()
  })
}

// =====================
// PEMBAYARAN HUTANG CRUD
// =====================
export const pembayaranHutangCollection = collection(db, COLLECTIONS.PEMBAYARAN_HUTANG)

export const getPembayaranHutangByHutangId = async (hutangId: string): Promise<PembayaranHutang[]> => {
  const q = query(pembayaranHutangCollection, where('hutangId', '==', hutangId), orderBy('tanggal', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    tanggal: timestampToDate(doc.data().tanggal as Timestamp),
    createdAt: timestampToDate(doc.data().createdAt as Timestamp)
  })) as PembayaranHutang[]
}

export const addPembayaranHutang = async (data: Omit<PembayaranHutang, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(pembayaranHutangCollection, {
    ...data,
    tanggal: Timestamp.now(),
    createdAt: Timestamp.now()
  })
  return docRef.id
}

// =====================
// CASH FLOW CRUD
// =====================
export const cashFlowCollection = collection(db, COLLECTIONS.CASH_FLOW)

export const getCashFlow = async (): Promise<CashFlow[]> => {
  const q = query(cashFlowCollection, orderBy('tanggal', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    tanggal: timestampToDate(doc.data().tanggal as Timestamp),
    createdAt: timestampToDate(doc.data().createdAt as Timestamp),
    updatedAt: doc.data().updatedAt ? timestampToDate(doc.data().updatedAt as Timestamp) : undefined
  })) as CashFlow[]
}

export const addCashFlow = async (data: Omit<CashFlow, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(cashFlowCollection, {
    ...data,
    tanggal: Timestamp.now(),
    createdAt: Timestamp.now()
  })
  return docRef.id
}

export const deleteCashFlow = async (id: string): Promise<void> => {
  const docRef = doc(cashFlowCollection, id)
  await deleteDoc(docRef)
}

// =====================
// BACKUP / RESTORE
// =====================
export const backupAllData = async () => {
  const [pelanggan, produk, transaksi, detailTransaksi, hutang, pembayaranHutang, cashFlow] = await Promise.all([
    getPelanggan(),
    getProduk(),
    getTransaksi(),
    getDocs(detailTransaksiCollection).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
    getHutang(),
    getDocs(pembayaranHutangCollection).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
    getCashFlow()
  ])
  
  return {
    exportDate: new Date().toISOString(),
    pelanggan,
    produk,
    transaksi,
    detailTransaksi,
    hutang,
    pembayaranHutang,
    cashFlow
  }
}

export const restoreAllData = async (data: any) => {
  const batch = writeBatch(db)
  
  // Clear and restore each collection
  if (data.pelanggan) {
    for (const item of data.pelanggan) {
      const docRef = doc(pelangganCollection, item.id)
      batch.set(docRef, {
        ...item,
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  if (data.produk) {
    for (const item of data.produk) {
      const docRef = doc(produkCollection, item.id)
      batch.set(docRef, {
        ...item,
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  if (data.transaksi) {
    for (const item of data.transaksi) {
      const docRef = doc(transaksiCollection, item.id)
      batch.set(docRef, {
        ...item,
        tanggal: Timestamp.fromDate(new Date(item.tanggal)),
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  if (data.detailTransaksi) {
    for (const item of data.detailTransaksi) {
      const docRef = doc(detailTransaksiCollection, item.id)
      batch.set(docRef, {
        ...item,
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  if (data.hutang) {
    for (const item of data.hutang) {
      const docRef = doc(hutangCollection, item.id)
      batch.set(docRef, {
        ...item,
        jatuhTempo: item.jatuhTempo ? Timestamp.fromDate(new Date(item.jatuhTempo)) : null,
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  if (data.pembayaranHutang) {
    for (const item of data.pembayaranHutang) {
      const docRef = doc(pembayaranHutangCollection, item.id)
      batch.set(docRef, {
        ...item,
        tanggal: Timestamp.fromDate(new Date(item.tanggal)),
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  if (data.cashFlow) {
    for (const item of data.cashFlow) {
      const docRef = doc(cashFlowCollection, item.id)
      batch.set(docRef, {
        ...item,
        tanggal: Timestamp.fromDate(new Date(item.tanggal)),
        createdAt: Timestamp.fromDate(new Date(item.createdAt))
      })
    }
  }
  
  await batch.commit()
}
