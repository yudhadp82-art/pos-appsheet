import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB4_LoZyuWsmgXI9zwOwzShjgQdOtNHoHY",
  authDomain: "pos-appsheet.firebaseapp.com",
  projectId: "pos-appsheet",
  storageBucket: "pos-appsheet.firebasestorage.app",
  messagingSenderId: "658514081162",
  appId: "1:658514081162:web:a474dbfbdd92f2db59c473"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Collection names
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
