'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Users, Package, ShoppingCart, CreditCard, Wallet, BarChart3, 
  Printer, Plus, Edit, Trash2, Search, Barcode, QrCode,
  DollarSign, TrendingUp, TrendingDown, Receipt, Eye, Phone,
  MapPin, Mail, FileText, Calendar, ArrowUpRight, ArrowDownRight,
  Menu, X, Home, ShoppingCartIcon, Download, Upload, Database,
  FileJson, FileSpreadsheet, Archive, HardDrive,
  Truck, ClipboardList, Box, PieChart as PieChartIcon
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { 
  type Pelanggan, type Produk, type Transaksi, type DetailTransaksi, 
  type Hutang, type PembayaranHutang, type CashFlow,
  type Supplier, type Pembelian, type DetailPembelian, type KartuStok,
  pelangganApi, produkApi, transaksiApi, hutangApi, cashFlowApi, backupApi,
  supplierApi, pembelianApi, kartuStokApi,
  generateBarcode 
} from '@/lib/api'

// Extended types with relations
interface TransaksiWithDetails extends Transaksi {
  pelanggan?: Pelanggan
  detailTransaksi: (DetailTransaksi & { produk: Produk })[]
}

interface HutangWithDetails extends Hutang {
  pelanggan: Pelanggan
  transaksi: TransaksiWithDetails
  pembayaran?: PembayaranHutang[]
}

interface CartItem {
  produk: Produk
  jumlah: number
}

// Pembelian cart item
interface PembelianCartItem {
  produk: Produk
  jumlah: number
  hargaBeli: number
}

// Pembelian with details
interface PembelianWithDetails extends Pembelian {
  supplier?: Supplier
  detailPembelian: (DetailPembelian & { produk: Produk })[]
}

// Kartu Stok with product
interface KartuStokWithProduk extends KartuStok {
  produk?: Produk
}

// Laporan Laba
interface LaporanLaba {
  totalPenjualan: number
  totalHpp: number
  labaKotor: number
  labaBersih: number
  dailyData: { date: string; penjualan: number; hpp: number; laba: number }[]
  productData: { produkId: string; nama: string; qty: number; penjualan: number; hpp: number; laba: number }[]
}

// Format currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date
const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function POSApp() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([])
  const [produk, setProduk] = useState<Produk[]>([])
  const [transaksi, setTransaksi] = useState<TransaksiWithDetails[]>([])
  const [hutang, setHutang] = useState<HutangWithDetails[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [showPelangganDialog, setShowPelangganDialog] = useState(false)
  const [showProdukDialog, setShowProdukDialog] = useState(false)
  const [showTransaksiDialog, setShowTransaksiDialog] = useState(false)
  const [showHutangDialog, setShowHutangDialog] = useState(false)
  const [showCashDialog, setShowCashDialog] = useState(false)
  const [showNotaDialog, setShowNotaDialog] = useState(false)
  
  // Edit states
  const [editPelanggan, setEditPelanggan] = useState<Pelanggan | null>(null)
  const [editProduk, setEditProduk] = useState<Produk | null>(null)
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPelanggan, setSelectedPelanggan] = useState<string>('')
  const [searchBarcode, setSearchBarcode] = useState('')
  const [searchProduk, setSearchProduk] = useState('')
  const [searchPelanggan, setSearchPelanggan] = useState('')
  const [showPelangganList, setShowPelangganList] = useState(false)
  
  // Payment state
  const [diskon, setDiskon] = useState(0)
  const [pajak, setPajak] = useState(0)
  const [bayar, setBayar] = useState(0)
  const [metodePembayaran, setMetodePembayaran] = useState('CASH')
  const [jatuhTempo, setJatuhTempo] = useState('')
  
  // Selected nota
  const [selectedNota, setSelectedNota] = useState<TransaksiWithDetails | null>(null)
  
  // Hutang payment
  const [selectedHutang, setSelectedHutang] = useState<HutangWithDetails | null>(null)
  const [bayarHutang, setBayarHutang] = useState(0)
  const [keteranganBayar, setKeteranganBayar] = useState('')
  
  // Cash flow
  const [cashTipe, setCashTipe] = useState('MASUK')
  const [cashKategori, setCashKategori] = useState('')
  const [cashJumlah, setCashJumlah] = useState(0)
  const [cashKeterangan, setCashKeterangan] = useState('')
  
  // Date filter
  const [dariTanggal, setDariTanggal] = useState('')
  const [sampaiTanggal, setSampaiTanggal] = useState('')

  // Supplier state
  const [supplier, setSupplier] = useState<Supplier[]>([])
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)

  // Pembelian state
  const [pembelian, setPembelian] = useState<PembelianWithDetails[]>([])
  const [showPembelianDialog, setShowPembelianDialog] = useState(false)
  const [pembelianCart, setPembelianCart] = useState<PembelianCartItem[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [ongkir, setOngkir] = useState(0)
  const [biayaLain, setBiayaLain] = useState(0)
  const [statusPembelian, setStatusPembelian] = useState('LUNAS')
  const [keteranganPembelian, setKeteranganPembelian] = useState('')

  // Kartu Stok state
  const [kartuStok, setKartuStok] = useState<KartuStokWithProduk[]>([])
  const [filterProdukId, setFilterProdukId] = useState<string>('')

  // Laporan Laba state
  const [laporanLaba, setLaporanLaba] = useState<LaporanLaba | null>(null)
  const [laporanDariTanggal, setLaporanDariTanggal] = useState('')
  const [laporanSampaiTanggal, setLaporanSampaiTanggal] = useState('')

  // Fetch all data from Firebase
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all data from API
      const response = await fetch('/api/data')
      const data = await response.json()
      
      // Process transaksi with relations
      const enrichedTransaksi: TransaksiWithDetails[] = (data.transaksi || []).map((t: Transaksi) => {
        const pelanggan = t.pelangganId ? data.pelanggan?.find((p: Pelanggan) => p.id === t.pelangganId) : undefined
        const details = (data.detailTransaksi || [])
          .filter((d: DetailTransaksi) => d.transaksiId === t.id)
          .map((d: DetailTransaksi) => {
            const produk = data.produk?.find((p: Produk) => p.id === d.produkId)
            return { ...d, produk: produk! }
          })
        return { ...t, pelanggan, detailTransaksi: details }
      })
      
      // Process hutang with relations
      const enrichedHutang: HutangWithDetails[] = (data.hutang || []).map((h: Hutang) => {
        const pelanggan = data.pelanggan?.find((p: Pelanggan) => p.id === h.pelangganId)
        const transaksi = enrichedTransaksi.find((t: TransaksiWithDetails) => t.id === h.transaksiId)
        const pembayaran = (data.pembayaranHutang || []).filter((p: PembayaranHutang) => p.hutangId === h.id)
        return { ...h, pelanggan: pelanggan!, transaksi: transaksi!, pembayaran }
      })
      
      setPelanggan(data.pelanggan || [])
      setProduk(data.produk || [])
      setTransaksi(enrichedTransaksi)
      setHutang(enrichedHutang)
      setCashFlow(data.cashFlow || [])
      
      // Process supplier
      setSupplier(data.supplier || [])
      
      // Process pembelian with relations
      const enrichedPembelian: PembelianWithDetails[] = (data.pembelian || []).map((p: Pembelian) => {
        const supplierData = data.supplier?.find((s: Supplier) => s.id === p.supplierId)
        const details = (data.detailPembelian || [])
          .filter((d: DetailPembelian) => d.pembelianId === p.id)
          .map((d: DetailPembelian) => {
            const produkData = data.produk?.find((pr: Produk) => pr.id === d.produkId)
            return { ...d, produk: produkData! }
          })
        return { ...p, supplier: supplierData, detailPembelian: details }
      })
      setPembelian(enrichedPembelian)
      
      // Process kartu stok with product
      const enrichedKartuStok: KartuStokWithProduk[] = (data.kartuStok || []).map((ks: KartuStok) => {
        const produkData = data.produk?.find((p: Produk) => p.id === ks.produkId)
        return { ...ks, produk: produkData }
      })
      setKartuStok(enrichedKartuStok)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal mengambil data dari server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Pelanggan CRUD
  const handleSavePelanggan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Partial<Pelanggan> = {
      noPelanggan: formData.get('noPelanggan') as string,
      nama: formData.get('nama') as string,
      alamat: formData.get('alamat') as string || undefined,
      telepon: formData.get('telepon') as string || undefined,
      createdAt: editPelanggan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      if (editPelanggan) {
        await pelangganApi.update(editPelanggan.id, data)
        toast.success('Pelanggan berhasil diupdate')
      } else {
        await pelangganApi.create(data)
        toast.success('Pelanggan berhasil ditambahkan')
      }
      setShowPelangganDialog(false)
      setEditPelanggan(null)
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menyimpan pelanggan')
    }
  }

  const handleDeletePelanggan = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pelanggan ini?')) return
    try {
      await pelangganApi.delete(id)
      toast.success('Pelanggan berhasil dihapus')
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menghapus pelanggan')
    }
  }

  // Produk CRUD
  const handleSaveProduk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Partial<Produk> = {
      nama: formData.get('nama') as string,
      barcode: formData.get('barcode') as string || generateBarcode(),
      hargaBeli: parseFloat(formData.get('hargaBeli') as string) || 0,
      hargaJual: parseFloat(formData.get('hargaJual') as string) || 0,
      stok: parseInt(formData.get('stok') as string) || 0,
      stokMinimum: parseInt(formData.get('stokMinimum') as string) || 5,
      kategori: formData.get('kategori') as string || undefined,
      deskripsi: formData.get('deskripsi') as string || undefined,
      gambar: formData.get('gambar') as string || undefined,
      satuan: formData.get('satuan') as string || 'pcs',
      supplierId: formData.get('supplierId') as string || undefined,
      createdAt: editProduk?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      if (editProduk) {
        await produkApi.update(editProduk.id, data)
        toast.success('Produk berhasil diupdate')
      } else {
        await produkApi.create(data)
        toast.success('Produk berhasil ditambahkan')
      }
      setShowProdukDialog(false)
      setEditProduk(null)
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menyimpan produk')
    }
  }

  const handleDeleteProduk = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return
    try {
      await produkApi.delete(id)
      toast.success('Produk berhasil dihapus')
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menghapus produk')
    }
  }

  // Cart functions
  const addToCart = (produk: Produk) => {
    const existing = cart.find(item => item.produk.id === produk.id)
    if (existing) {
      setCart(cart.map(item => 
        item.produk.id === produk.id 
          ? { ...item, jumlah: item.jumlah + 1 }
          : item
      ))
    } else {
      setCart([...cart, { produk, jumlah: 1 }])
    }
    toast.success(`${produk.nama} ditambahkan ke keranjang`)
  }

  const updateCartQty = (produkId: string, jumlah: number) => {
    if (jumlah <= 0) {
      setCart(cart.filter(item => item.produk.id !== produkId))
    } else {
      setCart(cart.map(item =>
        item.produk.id === produkId ? { ...item, jumlah } : item
      ))
    }
  }

  const removeFromCart = (produkId: string) => {
    setCart(cart.filter(item => item.produk.id !== produkId))
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.produk.hargaJual * item.jumlah), 0)
  const cartTotal = cartSubtotal - diskon + pajak

  // Search product by barcode
  const handleBarcodeSearch = async () => {
    if (!searchBarcode) return
    const found = produk.find(p => p.barcode === searchBarcode)
    if (found) {
      addToCart(found)
      setSearchBarcode('')
    } else {
      toast.error('Produk tidak ditemukan')
    }
  }

  // Create transaction
  const handleCreateTransaksi = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong')
      return
    }

    if (metodePembayaran === 'HUTANG' && !selectedPelanggan) {
      toast.error('Pilih pelanggan untuk transaksi hutang')
      return
    }

    try {
      const noNota = `POS${Date.now().toString().slice(-10)}`
      const now = new Date().toISOString()
      
      // Prepare transaction data
      const transaksiData = {
        noNota,
        pelangganId: selectedPelanggan || null,
        tanggal: now,
        subtotal: cartSubtotal,
        diskon,
        pajak,
        total: cartTotal,
        bayar: metodePembayaran === 'HUTANG' ? 0 : bayar,
        kembalian: metodePembayaran === 'HUTANG' ? 0 : Math.max(0, bayar - cartTotal),
        metodePembayaran,
        status: metodePembayaran === 'HUTANG' ? 'HUTANG' : 'LUNAS',
        createdAt: now,
        updatedAt: now
      }
      
      // Prepare detail transaksi
      const detailTransaksiData = cart.map(item => ({
        produkId: item.produk.id,
        jumlah: item.jumlah,
        harga: item.produk.hargaJual,
        subtotal: item.produk.hargaJual * item.jumlah
      }))
      
      // Prepare hutang if needed
      const hutangData = metodePembayaran === 'HUTANG' ? {
        pelangganId: selectedPelanggan,
        totalHutang: cartTotal,
        sisaHutang: cartTotal,
        jatuhTempo: jatuhTempo || null,
        status: 'BELUM_LUNAS',
        createdAt: now,
        updatedAt: now
      } : undefined
      
      // Prepare cash flow if payment is cash
      const cashFlowData = metodePembayaran === 'CASH' ? {
        tipe: 'MASUK',
        kategori: 'Penjualan',
        jumlah: bayar >= cartTotal ? cartTotal : bayar,
        keterangan: `Penjualan ${noNota}`,
        tanggal: now,
        createdAt: now
      } : undefined
      
      // Create transaction via API
      const result = await transaksiApi.create({
        transaksi: transaksiData,
        detailTransaksi: detailTransaksiData,
        hutang: hutangData,
        cashFlow: cashFlowData
      })
      
      toast.success('Transaksi berhasil dibuat')
      
      // Show nota
      const pelangganData = selectedPelanggan ? pelanggan.find(p => p.id === selectedPelanggan) : undefined
      const enrichedDetails = cart.map(item => ({
        produkId: item.produk.id,
        jumlah: item.jumlah,
        harga: item.produk.hargaJual,
        subtotal: item.produk.hargaJual * item.jumlah,
        produk: item.produk
      }))
      
      setSelectedNota({
        id: result.transaksiId,
        noNota,
        pelangganId: selectedPelanggan || null,
        tanggal: now,
        subtotal: cartSubtotal,
        diskon,
        pajak,
        total: cartTotal,
        bayar: transaksiData.bayar,
        kembalian: transaksiData.kembalian,
        metodePembayaran,
        status: transaksiData.status,
        pelanggan: pelangganData,
        detailTransaksi: enrichedDetails
      })
      setShowNotaDialog(true)
      
      // Reset
      setCart([])
      setSelectedPelanggan('')
      setDiskon(0)
      setPajak(0)
      setBayar(0)
      setMetodePembayaran('CASH')
      setJatuhTempo('')
      setShowTransaksiDialog(false)
      
      fetchAllData()
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Gagal membuat transaksi')
    }
  }

  // Pay hutang
  const handlePayHutang = async () => {
    if (!selectedHutang || bayarHutang <= 0) return

    try {
      const now = new Date().toISOString()
      const newSisaHutang = selectedHutang.sisaHutang - bayarHutang
      
      await hutangApi.bayar(selectedHutang.id, {
        pembayaran: {
          jumlah: bayarHutang,
          tanggal: now,
          keterangan: keteranganBayar || undefined
        },
        sisaHutang: newSisaHutang,
        cashFlow: {
          tipe: 'MASUK',
          kategori: 'Pembayaran Hutang',
          jumlah: bayarHutang,
          keterangan: `Pembayaran hutang ${selectedHutang.pelanggan?.nama || ''}`,
          tanggal: now,
          createdAt: now
        }
      })
      
      toast.success('Pembayaran berhasil')
      setShowHutangDialog(false)
      setSelectedHutang(null)
      setBayarHutang(0)
      setKeteranganBayar('')
      fetchAllData()
    } catch (error) {
      toast.error('Gagal memproses pembayaran')
    }
  }

  // Create cash flow
  const handleCreateCashFlow = async () => {
    if (!cashKategori || cashJumlah <= 0) {
      toast.error('Lengkapi data arus kas')
      return
    }

    try {
      const now = new Date().toISOString()
      await cashFlowApi.create({
        tipe: cashTipe,
        kategori: cashKategori,
        jumlah: cashJumlah,
        keterangan: cashKeterangan || undefined,
        tanggal: now,
        createdAt: now
      })
      toast.success('Arus kas berhasil ditambahkan')
      setShowCashDialog(false)
      setCashKategori('')
      setCashJumlah(0)
      setCashKeterangan('')
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menambahkan arus kas')
    }
  }

  // Supplier CRUD
  const handleSaveSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Partial<Supplier> = {
      kode: formData.get('kode') as string,
      nama: formData.get('nama') as string,
      alamat: formData.get('alamat') as string || undefined,
      telepon: formData.get('telepon') as string || undefined,
      email: formData.get('email') as string || undefined,
      createdAt: editSupplier?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      if (editSupplier) {
        await supplierApi.update(editSupplier.id, data)
        toast.success('Supplier berhasil diupdate')
      } else {
        await supplierApi.create(data)
        toast.success('Supplier berhasil ditambahkan')
      }
      setShowSupplierDialog(false)
      setEditSupplier(null)
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menyimpan supplier')
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Yakin ingin menghapus supplier ini?')) return
    try {
      await supplierApi.delete(id)
      toast.success('Supplier berhasil dihapus')
      fetchAllData()
    } catch (error) {
      toast.error('Gagal menghapus supplier')
    }
  }

  // Pembelian functions
  const addToPembelianCart = (produk: Produk) => {
    const existing = pembelianCart.find(item => item.produk.id === produk.id)
    if (existing) {
      setPembelianCart(pembelianCart.map(item => 
        item.produk.id === produk.id 
          ? { ...item, jumlah: item.jumlah + 1 }
          : item
      ))
    } else {
      setPembelianCart([...pembelianCart, { produk, jumlah: 1, hargaBeli: produk.hargaBeli }])
    }
    toast.success(`${produk.nama} ditambahkan ke pembelian`)
  }

  const updatePembelianCartQty = (produkId: string, jumlah: number) => {
    if (jumlah <= 0) {
      setPembelianCart(pembelianCart.filter(item => item.produk.id !== produkId))
    } else {
      setPembelianCart(pembelianCart.map(item =>
        item.produk.id === produkId ? { ...item, jumlah } : item
      ))
    }
  }

  const updatePembelianCartPrice = (produkId: string, hargaBeli: number) => {
    setPembelianCart(pembelianCart.map(item =>
      item.produk.id === produkId ? { ...item, hargaBeli } : item
    ))
  }

  const removeFromPembelianCart = (produkId: string) => {
    setPembelianCart(pembelianCart.filter(item => item.produk.id !== produkId))
  }

  const pembelianSubtotal = pembelianCart.reduce((sum, item) => sum + (item.hargaBeli * item.jumlah), 0)
  const pembelianGrandTotal = pembelianSubtotal + ongkir + biayaLain

  const handleCreatePembelian = async () => {
    if (pembelianCart.length === 0) {
      toast.error('Keranjang pembelian masih kosong')
      return
    }

    if (!selectedSupplier) {
      toast.error('Pilih supplier untuk pembelian')
      return
    }

    try {
      const noFaktur = `PO${Date.now().toString().slice(-10)}`
      const now = new Date().toISOString()
      
      // Prepare pembelian data
      const pembelianData = {
        noFaktur,
        supplierId: selectedSupplier,
        tanggal: now,
        totalHarga: pembelianSubtotal,
        biayaOngkir: ongkir,
        biayaLain,
        grandTotal: pembelianGrandTotal,
        status: statusPembelian,
        keterangan: keteranganPembelian || undefined,
        createdAt: now,
        updatedAt: now
      }
      
      // Prepare detail pembelian
      const detailPembelianData = pembelianCart.map(item => ({
        produkId: item.produk.id,
        jumlah: item.jumlah,
        hargaBeli: item.hargaBeli,
        subtotal: item.hargaBeli * item.jumlah
      }))
      
      // Prepare cash flow if status is LUNAS
      const cashFlowData = statusPembelian === 'LUNAS' ? {
        tipe: 'KELUAR' as const,
        kategori: 'Pembelian',
        jumlah: pembelianGrandTotal,
        keterangan: `Pembelian ${noFaktur}`,
        tanggal: now,
        createdAt: now
      } : undefined
      
      await pembelianApi.create({
        pembelian: pembelianData,
        detailPembelian: detailPembelianData,
        cashFlow: cashFlowData
      })
      
      toast.success('Pembelian berhasil dibuat')
      
      // Reset
      setPembelianCart([])
      setSelectedSupplier('')
      setOngkir(0)
      setBiayaLain(0)
      setStatusPembelian('LUNAS')
      setKeteranganPembelian('')
      setShowPembelianDialog(false)
      
      fetchAllData()
    } catch (error) {
      console.error('Error creating pembelian:', error)
      toast.error('Gagal membuat pembelian')
    }
  }

  // Fetch Laporan Laba
  const fetchLaporanLaba = async () => {
    try {
      const params = new URLSearchParams()
      if (laporanDariTanggal) params.append('dariTanggal', laporanDariTanggal)
      if (laporanSampaiTanggal) params.append('sampaiTanggal', laporanSampaiTanggal)
      
      const response = await fetch(`/api/laporan?${params.toString()}`)
      const data = await response.json()
      setLaporanLaba(data)
    } catch (error) {
      console.error('Error fetching laporan laba:', error)
      toast.error('Gagal mengambil laporan laba')
    }
  }

  // Print nota
  const handlePrintNota = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !selectedNota) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota ${selectedNota.noNota}</title>
        <style>
          body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .title { font-size: 16px; font-weight: bold; }
          .info { margin-bottom: 10px; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total-section { margin-top: 10px; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">POS APPSHEET</div>
          <div>Sistem Manajemen Keuangan</div>
        </div>
        <div class="info">
          <div>No: ${selectedNota.noNota}</div>
          <div>Tanggal: ${formatDate(selectedNota.tanggal)}</div>
          ${selectedNota.pelanggan ? `<div>Pelanggan: ${selectedNota.pelanggan.nama}</div>` : ''}
        </div>
        <div class="items">
          ${selectedNota.detailTransaksi.map(dt => `
            <div class="item">
              <div>${dt.produk.nama}</div>
              <div>${dt.jumlah} x ${formatRupiah(dt.harga)}</div>
            </div>
            <div class="item" style="padding-left: 20px;">
              <div></div>
              <div>${formatRupiah(dt.subtotal)}</div>
            </div>
          `).join('')}
        </div>
        <div class="total-section">
          <div class="row"><span>Subtotal:</span><span>${formatRupiah(selectedNota.subtotal)}</span></div>
          ${selectedNota.diskon > 0 ? `<div class="row"><span>Diskon:</span><span>-${formatRupiah(selectedNota.diskon)}</span></div>` : ''}
          ${selectedNota.pajak > 0 ? `<div class="row"><span>Pajak:</span><span>${formatRupiah(selectedNota.pajak)}</span></div>` : ''}
          <div class="row" style="font-weight: bold; font-size: 14px;"><span>TOTAL:</span><span>${formatRupiah(selectedNota.total)}</span></div>
          <div class="row"><span>Bayar:</span><span>${formatRupiah(selectedNota.bayar)}</span></div>
          <div class="row"><span>Kembali:</span><span>${formatRupiah(selectedNota.kembalian)}</span></div>
          <div class="row"><span>Metode:</span><span>${selectedNota.metodePembayaran}</span></div>
        </div>
        <div class="footer">
          <div>Terima Kasih Atas Kunjungan Anda</div>
          <div>Barang yang sudah dibeli tidak dapat ditukar</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Calculate stats
  const totalPenjualan = transaksi.reduce((sum, t) => sum + t.total, 0)
  const totalPiutang = hutang.reduce((sum, h) => sum + h.sisaHutang, 0)
  const totalMasuk = cashFlow.filter(c => c.tipe === 'MASUK').reduce((sum, c) => sum + c.jumlah, 0)
  const totalKeluar = cashFlow.filter(c => c.tipe === 'KELUAR').reduce((sum, c) => sum + c.jumlah, 0)
  const saldoKas = totalMasuk - totalKeluar

  // Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  const salesChartData = last7Days.map(date => {
    const dayTotal = transaksi
      .filter(t => new Date(t.tanggal).toISOString().split('T')[0] === date)
      .reduce((sum, t) => sum + t.total, 0)
    return { date: date.slice(5), total: dayTotal }
  })

  const cashFlowByCategory = cashFlow.reduce((acc, c) => {
    if (!acc[c.kategori]) {
      acc[c.kategori] = { masuk: 0, keluar: 0 }
    }
    if (c.tipe === 'MASUK') {
      acc[c.kategori].masuk += c.jumlah
    } else {
      acc[c.kategori].keluar += c.jumlah
    }
    return acc
  }, {} as Record<string, { masuk: number; keluar: number }>)

  const cashFlowPieData = Object.entries(cashFlowByCategory).map(([name, data]) => ({
    name,
    value: data.masuk + data.keluar
  }))

  // Top products
  const productSales: Record<string, { nama: string; jumlah: number; total: number }> = {}
  transaksi.forEach(t => {
    t.detailTransaksi.forEach(dt => {
      if (!productSales[dt.produkId]) {
        productSales[dt.produkId] = { nama: dt.produk.nama, jumlah: 0, total: 0 }
      }
      productSales[dt.produkId].jumlah += dt.jumlah
      productSales[dt.produkId].total += dt.subtotal
    })
  })
  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Stats cards
  const statsCards = [
    { 
      title: 'Total Penjualan', 
      value: formatRupiah(totalPenjualan), 
      icon: DollarSign, 
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      title: 'Jumlah Transaksi', 
      value: transaksi.length, 
      icon: ShoppingCart, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      title: 'Total Piutang', 
      value: formatRupiah(totalPiutang), 
      icon: CreditCard, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    { 
      title: 'Saldo Kas', 
      value: formatRupiah(saldoKas), 
      icon: Wallet, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ]

  // Navigation items
  const navItems = [
    { value: 'dashboard', icon: Home, label: 'Dashboard' },
    { value: 'pelanggan', icon: Users, label: 'Pelanggan' },
    { value: 'supplier', icon: Truck, label: 'Supplier' },
    { value: 'produk', icon: Package, label: 'Produk' },
    { value: 'persediaan', icon: Box, label: 'Persediaan' },
    { value: 'pembelian', icon: ClipboardList, label: 'Pembelian' },
    { value: 'transaksi', icon: ShoppingCartIcon, label: 'Transaksi' },
    { value: 'hutang', icon: CreditCard, label: 'Hutang' },
    { value: 'cash', icon: Wallet, label: 'Cash' },
    { value: 'laporan', icon: BarChart3, label: 'Laporan' },
    { value: 'backup', icon: Database, label: 'Backup' },
  ]

  // Export functions
  const exportToJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          let val = row[h]
          if (val instanceof Date) val = val.toISOString()
          if (typeof val === 'string' && val.includes(',')) val = `"${val}"`
          return val ?? ''
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export all data
  const handleExportAll = async () => {
    try {
      const allData = await backupApi.export()
      exportToJSON(allData, 'pos_backup_complete')
      toast.success('Backup lengkap berhasil diekspor')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal mengekspor data')
    }
  }

  // Export pelanggan
  const handleExportPelanggan = () => {
    const data = pelanggan.map(p => ({
      no_pelanggan: p.noPelanggan || '',
      nama: p.nama,
      telepon: p.telepon || '',
      alamat: p.alamat || '',
      tanggal_daftar: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''
    }))
    exportToCSV(data, 'pelanggan')
    toast.success('Data pelanggan berhasil diekspor')
  }

  // Export produk
  const handleExportProduk = () => {
    const data = produk.map(p => ({
      nama: p.nama,
      barcode: p.barcode || '',
      kategori: p.kategori || '',
      harga_beli: p.hargaBeli,
      harga_jual: p.hargaJual,
      stok: p.stok,
      deskripsi: p.deskripsi || ''
    }))
    exportToCSV(data, 'produk_stok')
    toast.success('Data produk berhasil diekspor')
  }

  // Export transaksi
  const handleExportTransaksi = () => {
    const data = transaksi.map(t => ({
      no_nota: t.noNota,
      tanggal: new Date(t.tanggal).toISOString(),
      pelanggan: t.pelanggan?.nama || 'Walk-in',
      subtotal: t.subtotal,
      diskon: t.diskon,
      pajak: t.pajak,
      total: t.total,
      bayar: t.bayar,
      kembalian: t.kembalian,
      metode_pembayaran: t.metodePembayaran,
      status: t.status
    }))
    exportToCSV(data, 'transaksi_penjualan')
    toast.success('Data transaksi berhasil diekspor')
  }

  // Export cash flow
  const handleExportCashFlow = () => {
    const data = cashFlow.map(c => ({
      tanggal: new Date(c.tanggal).toISOString(),
      tipe: c.tipe,
      kategori: c.kategori,
      jumlah: c.jumlah,
      keterangan: c.keterangan || ''
    }))
    exportToCSV(data, 'laporan_keuangan')
    toast.success('Laporan keuangan berhasil diekspor')
  }

  // Import functions
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      await backupApi.import(data)
      toast.success('Data berhasil diimpor')
      fetchAllData()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Gagal mengimpor data. Pastikan format file benar.')
    }
    
    // Reset input
    event.target.value = ''
  }

  // Import pelanggan CSV
  const handleImportPelangganCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',')
      const now = new Date().toISOString()
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: any = {
          createdAt: now,
          updatedAt: now
        }
        headers.forEach((h, i) => {
          const key = h.trim().toLowerCase().replace(' ', '_')
          if (key === 'no_pelanggan' || key === 'noppelanggan' || key === 'no_id' || key === 'id') obj.noPelanggan = values[i]?.trim() || ''
          if (key === 'nama') obj.nama = values[i]?.trim() || ''
          if (key === 'telepon') obj.telepon = values[i]?.trim() || undefined
          if (key === 'alamat') obj.alamat = values[i]?.trim() || undefined
        })
        return obj
      }).filter(d => d.nama)

      // Import via API
      for (const item of data) {
        await pelangganApi.create(item)
      }
      toast.success(`${data.length} pelanggan berhasil diimpor`)
      fetchAllData()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Gagal mengimpor pelanggan')
    }
    
    event.target.value = ''
  }

  // Import produk CSV
  const handleImportProdukCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',')
      const now = new Date().toISOString()
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: any = {
          createdAt: now,
          updatedAt: now
        }
        headers.forEach((h, i) => {
          const key = h.trim().toLowerCase().replace(' ', '_')
          if (key === 'nama') obj.nama = values[i]?.trim() || ''
          if (key === 'barcode') obj.barcode = values[i]?.trim() || generateBarcode()
          if (key === 'kategori') obj.kategori = values[i]?.trim() || undefined
          if (key === 'harga_beli') obj.hargaBeli = parseFloat(values[i]) || 0
          if (key === 'harga_jual') obj.hargaJual = parseFloat(values[i]) || 0
          if (key === 'stok') obj.stok = parseInt(values[i]) || 0
          if (key === 'deskripsi') obj.deskripsi = values[i]?.trim() || undefined
        })
        return obj
      }).filter(d => d.nama)

      // Import via API
      for (const item of data) {
        await produkApi.create(item)
      }
      toast.success(`${data.length} produk berhasil diimpor`)
      fetchAllData()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Gagal mengimpor produk')
    }
    
    event.target.value = ''
  }

  // Filtered produk for search
  const filteredProduk = produk.filter(p => 
    p.nama.toLowerCase().includes(searchProduk.toLowerCase()) ||
    p.barcode.includes(searchProduk)
  )

  // Filtered pelanggan for search
  const filteredPelanggan = pelanggan.filter(p => 
    p.nama.toLowerCase().includes(searchPelanggan.toLowerCase()) ||
    (p.noPelanggan && p.noPelanggan.toLowerCase().includes(searchPelanggan.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">POS AppSheet</h1>
                  <p className="text-blue-200 text-xs hidden sm:block">Sistem Manajemen Keuangan</p>
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-blue-200 text-xs">Tanggal</div>
              <div className="font-semibold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            <span className="font-bold">POS AppSheet</span>
          </div>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-2">
          {navItems.map(item => (
            <button
              key={item.value}
              onClick={() => { setActiveTab(item.value); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeTab === item.value ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Desktop Navigation */}
          <TabsList className="hidden lg:grid grid-cols-8 w-full gap-1 h-auto p-1 bg-white rounded-lg shadow">
            {navItems.map(item => (
              <TabsTrigger key={item.value} value={item.value} className="flex flex-col items-center gap-1 py-2 px-2 text-sm">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {statsCards.map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">{stat.title}</p>
                            <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                          </div>
                          <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor}`}>
                            <stat.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${stat.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Grafik Penjualan (7 Hari Terakhir)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{ total: { label: 'Total', color: '#3b82f6' } }} className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(value) => `${(value/1000000).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        Arus Kas per Kategori
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{ value: { label: 'Nilai', color: '#22c55e' } }} className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cashFlowPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {cashFlowPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Products & Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Produk Terlaris</CardTitle>
                      <CardDescription>10 produk dengan penjualan tertinggi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-3">
                        {topProducts.slice(0, 10).map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs sm:text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{product.nama}</p>
                                <p className="text-xs text-gray-500">{product.jumlah} terjual</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600 text-sm">{formatRupiah(product.total)}</p>
                            </div>
                          </div>
                        ))}
                        {topProducts.length === 0 && (
                          <p className="text-center text-gray-500 py-4">Belum ada data penjualan</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Transaksi Terbaru</CardTitle>
                      <CardDescription>5 transaksi terakhir</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-3">
                        {transaksi.slice(0, 5).map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{t.noNota}</p>
                              <p className="text-xs text-gray-500">{t.pelanggan?.nama || 'Walk-in'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{formatRupiah(t.total)}</p>
                              <Badge variant={t.status === 'LUNAS' ? 'default' : 'destructive'} className="text-xs">
                                {t.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {transaksi.length === 0 && (
                          <p className="text-center text-gray-500 py-4">Belum ada transaksi</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Pelanggan Tab */}
              <TabsContent value="pelanggan" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Manajemen Pelanggan</h2>
                    <p className="text-gray-500 text-sm">Kelola data pelanggan Anda</p>
                  </div>
                  <Dialog open={showPelangganDialog} onOpenChange={(open) => { setShowPelangganDialog(open); if (!open) setEditPelanggan(null) }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Pelanggan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editPelanggan ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle>
                        <DialogDescription>Masukkan data pelanggan dengan lengkap</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSavePelanggan} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="noPelanggan">No. ID Pelanggan *</Label>
                          <Input id="noPelanggan" name="noPelanggan" defaultValue={editPelanggan?.noPelanggan || ''} placeholder="Contoh: P001, CUST-001, dll" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nama">Nama Lengkap *</Label>
                          <Input id="nama" name="nama" defaultValue={editPelanggan?.nama} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telepon">No. Telepon</Label>
                          <Input id="telepon" name="telepon" defaultValue={editPelanggan?.telepon || ''} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alamat">Alamat</Label>
                          <Textarea id="alamat" name="alamat" defaultValue={editPelanggan?.alamat || ''} />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full">Simpan</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. ID</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead className="hidden sm:table-cell">Telepon</TableHead>
                            <TableHead className="hidden lg:table-cell">Alamat</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pelanggan.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-blue-600 font-medium">{p.noPelanggan || '-'}</TableCell>
                              <TableCell className="font-medium">{p.nama}</TableCell>
                              <TableCell className="hidden sm:table-cell">{p.telepon || '-'}</TableCell>
                              <TableCell className="hidden lg:table-cell">{p.alamat || '-'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 sm:gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setEditPelanggan(p); setShowPelangganDialog(true) }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeletePelanggan(p.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {pelanggan.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                Belum ada data pelanggan
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Supplier Tab */}
              <TabsContent value="supplier" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Manajemen Supplier</h2>
                    <p className="text-gray-500 text-sm">Kelola data supplier/pemasok</p>
                  </div>
                  <Dialog open={showSupplierDialog} onOpenChange={(open) => { setShowSupplierDialog(open); if (!open) setEditSupplier(null) }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Supplier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
                        <DialogDescription>Masukkan data supplier</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const data: Partial<Supplier> = {
                          kode: formData.get('kode') as string,
                          nama: formData.get('nama') as string,
                          alamat: formData.get('alamat') as string || undefined,
                          telepon: formData.get('telepon') as string || undefined,
                          email: formData.get('email') as string || undefined,
                          createdAt: editSupplier?.createdAt || new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        }
                        try {
                          if (editSupplier) {
                            await supplierApi.update(editSupplier.id, data)
                            toast.success('Supplier berhasil diupdate')
                          } else {
                            await supplierApi.create(data)
                            toast.success('Supplier berhasil ditambahkan')
                          }
                          setShowSupplierDialog(false)
                          setEditSupplier(null)
                          fetchAllData()
                        } catch (error) {
                          toast.error('Gagal menyimpan supplier')
                        }
                      }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Kode Supplier *</Label>
                            <Input name="kode" defaultValue={editSupplier?.kode || `SUP${Date.now().toString().slice(-6)}`} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Nama Supplier *</Label>
                            <Input name="nama" defaultValue={editSupplier?.nama} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Alamat</Label>
                          <Textarea name="alamat" defaultValue={editSupplier?.alamat || ''} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Telepon</Label>
                            <Input name="telepon" defaultValue={editSupplier?.telepon || ''} />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" defaultValue={editSupplier?.email || ''} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full">Simpan</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead className="hidden sm:table-cell">Telepon</TableHead>
                            <TableHead className="hidden md:table-cell">Alamat</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {supplier.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono text-blue-600">{s.kode}</TableCell>
                              <TableCell className="font-medium">{s.nama}</TableCell>
                              <TableCell className="hidden sm:table-cell">{s.telepon || '-'}</TableCell>
                              <TableCell className="hidden md:table-cell">{s.alamat || '-'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setEditSupplier(s); setShowSupplierDialog(true) }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={async () => {
                                    if (!confirm('Yakin ingin menghapus supplier ini?')) return
                                    try {
                                      await supplierApi.delete(s.id)
                                      toast.success('Supplier berhasil dihapus')
                                      fetchAllData()
                                    } catch (error) {
                                      toast.error('Gagal menghapus supplier')
                                    }
                                  }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {supplier.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                Belum ada data supplier
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Produk Tab */}
              <TabsContent value="produk" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Manajemen Produk</h2>
                    <p className="text-gray-500 text-sm">Kelola stok dan harga produk</p>
                  </div>
                  <Dialog open={showProdukDialog} onOpenChange={(open) => { setShowProdukDialog(open); if (!open) setEditProduk(null) }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Produk
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editProduk ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                        <DialogDescription>Masukkan informasi produk</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveProduk} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nama-produk">Nama Produk *</Label>
                          <Input id="nama-produk" name="nama" defaultValue={editProduk?.nama} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="barcode">Barcode</Label>
                          <div className="flex gap-2">
                            <Input id="barcode" name="barcode" defaultValue={editProduk?.barcode || generateBarcode()} />
                            <Button type="button" variant="outline" onClick={() => {
                              const input = document.getElementById('barcode') as HTMLInputElement
                              input.value = generateBarcode()
                            }}>
                              <Barcode className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hargaBeli">Harga Beli *</Label>
                            <Input id="hargaBeli" name="hargaBeli" type="number" defaultValue={editProduk?.hargaBeli} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hargaJual">Harga Jual *</Label>
                            <Input id="hargaJual" name="hargaJual" type="number" defaultValue={editProduk?.hargaJual} required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stok">Stok</Label>
                            <Input id="stok" name="stok" type="number" defaultValue={editProduk?.stok || 0} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stokMinimum">Stok Minimum</Label>
                            <Input id="stokMinimum" name="stokMinimum" type="number" defaultValue={editProduk?.stokMinimum || 5} placeholder="Alert stok rendah" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="satuan">Satuan</Label>
                            <Select name="satuan" defaultValue={editProduk?.satuan || 'pcs'}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih satuan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">Pcs</SelectItem>
                                <SelectItem value="kg">Kg</SelectItem>
                                <SelectItem value="gram">Gram</SelectItem>
                                <SelectItem value="liter">Liter</SelectItem>
                                <SelectItem value="ml">Ml</SelectItem>
                                <SelectItem value="meter">Meter</SelectItem>
                                <SelectItem value="box">Box</SelectItem>
                                <SelectItem value="pack">Pack</SelectItem>
                                <SelectItem value="lusin">Lusin</SelectItem>
                                <SelectItem value="set">Set</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <Select name="supplierId" defaultValue={editProduk?.supplierId || ''}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                {supplier.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="kategori">Kategori</Label>
                            <Input id="kategori" name="kategori" defaultValue={editProduk?.kategori || ''} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gambar">URL Gambar</Label>
                            <Input id="gambar" name="gambar" type="url" placeholder="https://..." defaultValue={editProduk?.gambar || ''} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deskripsi">Deskripsi</Label>
                          <Textarea id="deskripsi" name="deskripsi" defaultValue={editProduk?.deskripsi || ''} />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full">Simpan</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead className="hidden sm:table-cell">Barcode</TableHead>
                            <TableHead>Harga Jual</TableHead>
                            <TableHead className="hidden md:table-cell">Stok</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {produk.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.nama}</TableCell>
                              <TableCell className="hidden sm:table-cell font-mono text-xs">{p.barcode}</TableCell>
                              <TableCell>{formatRupiah(p.hargaJual)}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant={p.stok > 10 ? 'default' : p.stok > 0 ? 'secondary' : 'destructive'}>
                                  {p.stok}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 sm:gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setEditProduk(p); setShowProdukDialog(true) }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteProduk(p.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {produk.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                Belum ada data produk
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Persediaan Tab */}
              <TabsContent value="persediaan" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Persediaan Barang</h2>
                    <p className="text-gray-500 text-sm">Kartu stok dan monitoring persediaan</p>
                  </div>
                </div>

                {/* Stock Alert */}
                {produk.filter(p => p.stok <= p.stokMinimum).length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <Package className="w-5 h-5" />
                        <span className="font-semibold">Peringatan Stok Rendah!</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {produk.filter(p => p.stok <= p.stokMinimum).map(p => (
                          <Badge key={p.id} variant="destructive">{p.nama} ({p.stok} {p.satuan || 'pcs'})</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stock Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Produk</div>
                      <div className="text-2xl font-bold">{produk.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Stok</div>
                      <div className="text-2xl font-bold">{produk.reduce((sum, p) => sum + p.stok, 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Nilai Persediaan</div>
                      <div className="text-2xl font-bold text-green-600">{formatRupiah(produk.reduce((sum, p) => sum + (p.stok * p.hargaBeli), 0))}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Stok Rendah</div>
                      <div className="text-2xl font-bold text-red-600">{produk.filter(p => p.stok <= p.stokMinimum).length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Product Filter for Kartu Stok */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kartu Stok</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Select value={filterProdukId} onValueChange={setFilterProdukId}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Pilih produk..." />
                          </SelectTrigger>
                          <SelectContent>
                            {produk.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {filterProdukId && (
                        <ScrollArea className="h-64 border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Referensi</TableHead>
                                <TableHead className="text-right">Masuk</TableHead>
                                <TableHead className="text-right">Keluar</TableHead>
                                <TableHead className="text-right">Stok</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {kartuStok
                                .filter(ks => ks.produkId === filterProdukId)
                                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                                .map((ks) => (
                                  <TableRow key={ks.id}>
                                    <TableCell>{formatDate(ks.tanggal)}</TableCell>
                                    <TableCell>
                                      <Badge variant={ks.tipe === 'MASUK' ? 'default' : 'destructive'}>
                                        {ks.tipe}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{ks.referensi}</TableCell>
                                    <TableCell className="text-right text-green-600">
                                      {ks.tipe === 'MASUK' ? `+${ks.jumlah}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-red-600">
                                      {ks.tipe === 'KELUAR' ? `-${ks.jumlah}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{ks.stokSesudah}</TableCell>
                                  </TableRow>
                                ))}
                              {kartuStok.filter(ks => ks.produkId === filterProdukId).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                    Belum ada riwayat stok
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pembelian Tab */}
              <TabsContent value="pembelian" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Pembelian Barang</h2>
                    <p className="text-gray-500 text-sm">Catat pembelian dari supplier</p>
                  </div>
                  <Dialog open={showPembelianDialog} onOpenChange={setShowPembelianDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Pembelian Baru
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Buat Pembelian Baru</DialogTitle>
                        <DialogDescription>Catat pembelian dari supplier</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Supplier Selection */}
                        <div className="space-y-2">
                          <Label>Supplier *</Label>
                          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {supplier.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.nama} ({s.kode})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Product Search */}
                        <div className="space-y-2">
                          <Label>Cari Produk</Label>
                          <Input 
                            placeholder="Ketik nama produk..." 
                            value={searchProduk}
                            onChange={(e) => setSearchProduk(e.target.value)}
                          />
                        </div>

                        {/* Product List */}
                        <ScrollArea className="h-40 border rounded-lg p-2">
                          <div className="grid grid-cols-2 gap-2">
                            {filteredProduk.slice(0, 8).map((p) => (
                              <Button 
                                key={p.id} 
                                variant="outline" 
                                className="h-auto py-2 justify-start"
                                onClick={() => {
                                  const existing = pembelianCart.find(item => item.produk.id === p.id)
                                  if (existing) {
                                    setPembelianCart(pembelianCart.map(item => 
                                      item.produk.id === p.id 
                                        ? { ...item, jumlah: item.jumlah + 1 }
                                        : item
                                    ))
                                  } else {
                                    setPembelianCart([...pembelianCart, { produk: p, jumlah: 1, hargaBeli: p.hargaBeli }])
                                  }
                                }}
                              >
                                <div className="text-left">
                                  <div className="font-medium text-xs">{p.nama}</div>
                                  <div className="text-gray-500 text-xs">{formatRupiah(p.hargaBeli)}</div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>

                        {/* Cart */}
                        <div className="border rounded-lg p-3">
                          <h4 className="font-semibold mb-2">Item Pembelian</h4>
                          {pembelianCart.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Klik produk untuk menambahkan</p>
                          ) : (
                            <div className="space-y-2">
                              {pembelianCart.map((item) => (
                                <div key={item.produk.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.produk.nama}</p>
                                    <Input 
                                      type="number"
                                      className="h-7 w-24 mt-1"
                                      value={item.hargaBeli}
                                      onChange={(e) => {
                                        setPembelianCart(pembelianCart.map(c => 
                                          c.produk.id === item.produk.id 
                                            ? { ...c, hargaBeli: parseFloat(e.target.value) || 0 }
                                            : c
                                        ))
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setPembelianCart(pembelianCart.map(c => 
                                        c.produk.id === item.produk.id 
                                          ? { ...c, jumlah: c.jumlah - 1 }
                                          : c
                                      ).filter(c => c.jumlah > 0))
                                    }}>-</Button>
                                    <span className="w-8 text-center">{item.jumlah}</span>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setPembelianCart(pembelianCart.map(c => 
                                        c.produk.id === item.produk.id 
                                          ? { ...c, jumlah: c.jumlah + 1 }
                                          : c
                                      ))
                                    }}>+</Button>
                                    <Button size="sm" variant="destructive" onClick={() => {
                                      setPembelianCart(pembelianCart.filter(c => c.produk.id !== item.produk.id))
                                    }}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Costs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Ongkir</Label>
                            <Input type="number" value={ongkir} onChange={(e) => setOngkir(parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Biaya Lain</Label>
                            <Input type="number" value={biayaLain} onChange={(e) => setBiayaLain(parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusPembelian} onValueChange={setStatusPembelian}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LUNAS">Lunas</SelectItem>
                                <SelectItem value="HUTANG">Hutang</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan</Label>
                            <Input value={keteranganPembelian} onChange={(e) => setKeteranganPembelian(e.target.value)} />
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{formatRupiah(pembelianCart.reduce((sum, item) => sum + (item.hargaBeli * item.jumlah), 0))}</span>
                          </div>
                          {ongkir > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Ongkir:</span>
                              <span>{formatRupiah(ongkir)}</span>
                            </div>
                          )}
                          {biayaLain > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Biaya Lain:</span>
                              <span>{formatRupiah(biayaLain)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{formatRupiah(pembelianCart.reduce((sum, item) => sum + (item.hargaBeli * item.jumlah), 0) + ongkir + biayaLain)}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={async () => {
                            if (!selectedSupplier || pembelianCart.length === 0) {
                              toast.error('Pilih supplier dan tambahkan produk')
                              return
                            }
                            try {
                              const noFaktur = `PO${Date.now().toString().slice(-10)}`
                              const now = new Date().toISOString()
                              const subtotal = pembelianCart.reduce((sum, item) => sum + (item.hargaBeli * item.jumlah), 0)
                              const grandTotal = subtotal + ongkir + biayaLain
                              
                              await pembelianApi.create({
                                pembelian: {
                                  noFaktur,
                                  supplierId: selectedSupplier,
                                  tanggal: now,
                                  totalHarga: subtotal,
                                  biayaOngkir: ongkir,
                                  biayaLain,
                                  grandTotal,
                                  status: statusPembelian,
                                  keterangan: keteranganPembelian || undefined,
                                  createdAt: now,
                                  updatedAt: now
                                },
                                detailPembelian: pembelianCart.map(item => ({
                                  produkId: item.produk.id,
                                  jumlah: item.jumlah,
                                  hargaBeli: item.hargaBeli,
                                  subtotal: item.hargaBeli * item.jumlah
                                })),
                                cashFlow: statusPembelian === 'LUNAS' ? {
                                  tipe: 'KELUAR',
                                  kategori: 'Pembelian Stok',
                                  jumlah: grandTotal,
                                  keterangan: `Pembelian ${noFaktur}`,
                                  tanggal: now,
                                  createdAt: now
                                } : undefined
                              })
                              
                              toast.success('Pembelian berhasil dicatat')
                              setShowPembelianDialog(false)
                              setPembelianCart([])
                              setSelectedSupplier('')
                              setOngkir(0)
                              setBiayaLain(0)
                              setStatusPembelian('LUNAS')
                              setKeteranganPembelian('')
                              fetchAllData()
                            } catch (error) {
                              console.error(error)
                              toast.error('Gagal mencatat pembelian')
                            }
                          }} 
                          className="w-full"
                          disabled={pembelianCart.length === 0 || !selectedSupplier}
                        >
                          Simpan Pembelian
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Purchases List */}
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Faktur</TableHead>
                            <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                            <TableHead className="hidden md:table-cell">Supplier</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pembelian.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono">{p.noFaktur}</TableCell>
                              <TableCell className="hidden sm:table-cell">{formatDate(p.tanggal)}</TableCell>
                              <TableCell className="hidden md:table-cell">{p.supplier?.nama || '-'}</TableCell>
                              <TableCell>{formatRupiah(p.grandTotal)}</TableCell>
                              <TableCell>
                                <Badge variant={p.status === 'LUNAS' ? 'default' : 'destructive'}>
                                  {p.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {pembelian.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                Belum ada data pembelian
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transaksi Tab */}
              <TabsContent value="transaksi" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Transaksi Penjualan</h2>
                    <p className="text-gray-500 text-sm">Buat dan kelola transaksi</p>
                  </div>
                  <Dialog open={showTransaksiDialog} onOpenChange={setShowTransaksiDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Transaksi Baru
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Buat Transaksi Baru</DialogTitle>
                        <DialogDescription>Tambahkan produk ke keranjang</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Barcode Scanner */}
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Scan barcode..." 
                            value={searchBarcode}
                            onChange={(e) => setSearchBarcode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                          />
                          <Button onClick={handleBarcodeSearch}>
                            <Barcode className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Product Search */}
                        <Input 
                          placeholder="Cari produk..." 
                          value={searchProduk}
                          onChange={(e) => setSearchProduk(e.target.value)}
                        />

                        {/* Product List */}
                        <ScrollArea className="h-64 border rounded-lg p-2">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {filteredProduk.slice(0, 12).map((p) => (
                              <Button 
                                key={p.id} 
                                variant="outline" 
                                className="h-auto py-2 px-2 flex flex-col items-start gap-1 hover:bg-blue-50 hover:border-blue-300"
                                onClick={() => addToCart(p)}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  {p.gambar ? (
                                    <img 
                                      src={p.gambar} 
                                      alt={p.nama} 
                                      className="w-12 h-12 object-cover rounded border" 
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center border">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 text-left">
                                    <span className="font-medium text-xs block truncate">{p.nama}</span>
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 mt-0.5">
                                      {p.satuan || 'pcs'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex justify-between w-full mt-1">
                                  <span className="text-green-600 text-xs font-semibold">{formatRupiah(p.hargaJual)}</span>
                                  <span className="text-gray-500 text-xs">Stok: {p.stok}</span>
                                </div>
                              </Button>
                            ))}
                            {filteredProduk.length === 0 && (
                              <div className="col-span-3 py-8 text-center text-gray-500 text-sm">
                                Produk tidak ditemukan
                              </div>
                            )}
                          </div>
                        </ScrollArea>

                        {/* Cart */}
                        <div className="border rounded-lg p-3">
                          <h4 className="font-semibold mb-2">Keranjang</h4>
                          {cart.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">Keranjang kosong</p>
                          ) : (
                            <div className="space-y-2">
                              {cart.map((item) => (
                                <div key={item.produk.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <div className="flex items-center gap-2 flex-1">
                                    {item.produk.gambar ? (
                                      <img 
                                        src={item.produk.gambar} 
                                        alt={item.produk.nama} 
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                        <Package className="w-5 h-5 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">{item.produk.nama}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatRupiah(item.produk.hargaJual)} / {item.produk.satuan || 'pcs'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => updateCartQty(item.produk.id, item.jumlah - 1)}>-</Button>
                                    <span className="w-8 text-center">{item.jumlah}</span>
                                    <Button size="sm" variant="outline" onClick={() => updateCartQty(item.produk.id, item.jumlah + 1)}>+</Button>
                                    <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.produk.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Pelanggan dengan Search */}
                        <div className="space-y-2">
                          <Label>Pelanggan (opsional untuk cash)</Label>
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input 
                                placeholder="Ketik nama atau no. anggota..." 
                                value={searchPelanggan}
                                onChange={(e) => {
                                  setSearchPelanggan(e.target.value)
                                  setShowPelangganList(true)
                                }}
                                onFocus={() => setShowPelangganList(true)}
                                className="pl-9"
                              />
                            </div>
                            {/* Selected Pelanggan Display */}
                            {selectedPelanggan && !showPelangganList && (
                              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {pelanggan.find(p => p.id === selectedPelanggan)?.nama}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    No. Anggota: {pelanggan.find(p => p.id === selectedPelanggan)?.noPelanggan || '-'}
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setSelectedPelanggan('')
                                    setSearchPelanggan('')
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            {/* Dropdown List */}
                            {showPelangganList && (
                              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredPelanggan.length > 0 ? (
                                  filteredPelanggan.map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b last:border-b-0 flex items-center justify-between"
                                      onClick={() => {
                                        setSelectedPelanggan(p.id)
                                        setSearchPelanggan('')
                                        setShowPelangganList(false)
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <Users className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{p.nama}</p>
                                          <p className="text-xs text-gray-500">No. Anggota: {p.noPelanggan || '-'}</p>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                    Pelanggan tidak ditemukan
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-t text-sm text-gray-600"
                                  onClick={() => {
                                    setSelectedPelanggan('')
                                    setSearchPelanggan('')
                                    setShowPelangganList(false)
                                  }}
                                >
                                  <span className="text-gray-400">Walk-in (tanpa pelanggan)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Diskon</Label>
                            <Input type="number" value={diskon} onChange={(e) => setDiskon(parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Pajak</Label>
                            <Input type="number" value={pajak} onChange={(e) => setPajak(parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Metode Pembayaran</Label>
                            <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="HUTANG">Hutang</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {metodePembayaran === 'CASH' && (
                            <div className="space-y-2">
                              <Label>Bayar</Label>
                              <Input type="number" value={bayar} onChange={(e) => setBayar(parseFloat(e.target.value) || 0)} />
                            </div>
                          )}
                          {metodePembayaran === 'HUTANG' && (
                            <div className="space-y-2">
                              <Label>Jatuh Tempo</Label>
                              <Input type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} />
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span>{formatRupiah(cartSubtotal)}</span>
                          </div>
                          {diskon > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                              <span>Diskon:</span>
                              <span>-{formatRupiah(diskon)}</span>
                            </div>
                          )}
                          {pajak > 0 && (
                            <div className="flex justify-between text-sm">
                              <span>Pajak:</span>
                              <span>{formatRupiah(pajak)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span>{formatRupiah(cartTotal)}</span>
                          </div>
                          {metodePembayaran === 'CASH' && bayar > 0 && (
                            <div className="flex justify-between text-green-600 font-semibold">
                              <span>Kembali:</span>
                              <span>{formatRupiah(Math.max(0, bayar - cartTotal))}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateTransaksi} className="w-full" disabled={cart.length === 0}>
                          Proses Transaksi
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Transaction List */}
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Nota</TableHead>
                            <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                            <TableHead className="hidden md:table-cell">Pelanggan</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transaksi.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium">{t.noNota}</TableCell>
                              <TableCell className="hidden sm:table-cell">{formatDate(t.tanggal)}</TableCell>
                              <TableCell className="hidden md:table-cell">{t.pelanggan?.nama || 'Walk-in'}</TableCell>
                              <TableCell>{formatRupiah(t.total)}</TableCell>
                              <TableCell>
                                <Badge variant={t.status === 'LUNAS' ? 'default' : 'destructive'}>
                                  {t.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => { setSelectedNota(t); setShowNotaDialog(true) }}>
                                  <Receipt className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {transaksi.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                Belum ada transaksi
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hutang Tab */}
              <TabsContent value="hutang" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Manajemen Hutang</h2>
                    <p className="text-gray-500 text-sm">Kelola piutang pelanggan</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {hutang.map((h) => (
                    <Card key={h.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{h.pelanggan.nama}</p>
                              <Badge variant={h.status === 'LUNAS' ? 'default' : 'destructive'}>
                                {h.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">No. Nota: {h.transaksi.noNota}</p>
                            <p className="text-sm text-gray-500">Total Hutang: {formatRupiah(h.totalHutang)}</p>
                            <p className="text-sm font-semibold text-orange-600">Sisa: {formatRupiah(h.sisaHutang)}</p>
                            {h.jatuhTempo && (
                              <p className="text-sm text-gray-500">Jatuh Tempo: {formatDate(h.jatuhTempo)}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {h.status !== 'LUNAS' && (
                              <Dialog open={showHutangDialog && selectedHutang?.id === h.id} onOpenChange={(open) => { setShowHutangDialog(open); if (!open) setSelectedHutang(null) }}>
                                <DialogTrigger asChild>
                                  <Button onClick={() => setSelectedHutang(h)}>
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Bayar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Pembayaran Hutang</DialogTitle>
                                    <DialogDescription>
                                      {h.pelanggan.nama} - Sisa: {formatRupiah(h.sisaHutang)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Jumlah Bayar</Label>
                                      <Input 
                                        type="number" 
                                        value={bayarHutang} 
                                        onChange={(e) => setBayarHutang(parseFloat(e.target.value) || 0)}
                                        max={h.sisaHutang}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Keterangan</Label>
                                      <Input 
                                        value={keteranganBayar} 
                                        onChange={(e) => setKeteranganBayar(e.target.value)}
                                      />
                                    </div>
                                    <Button onClick={handlePayHutang} className="w-full">Bayar</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setSelectedNota(h.transaksi); setShowNotaDialog(true) }}>
                              <Receipt className="w-4 h-4 mr-2" />
                              Lihat Nota
                            </Button>
                          </div>
                        </div>
                        {h.pembayaran && h.pembayaran.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-semibold mb-2">Riwayat Pembayaran:</p>
                            <div className="space-y-1">
                              {h.pembayaran.map((pb) => (
                                <div key={pb.id} className="flex justify-between text-sm">
                                  <span>{formatDate(pb.tanggal)}</span>
                                  <span className="text-green-600">{formatRupiah(pb.jumlah)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {hutang.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-8 text-gray-500">
                        Belum ada data hutang
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Cash Tab */}
              <TabsContent value="cash" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Arus Kas</h2>
                    <p className="text-gray-500 text-sm">Kelola pemasukan dan pengeluaran</p>
                  </div>
                  <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Tambah Arus Kas</DialogTitle>
                        <DialogDescription>Catat pemasukan atau pengeluaran</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Tipe</Label>
                          <Select value={cashTipe} onValueChange={setCashTipe}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MASUK">Pemasukan</SelectItem>
                              <SelectItem value="KELUAR">Pengeluaran</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Kategori</Label>
                          <Select value={cashKategori} onValueChange={setCashKategori}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {cashTipe === 'MASUK' ? (
                                <>
                                  <SelectItem value="Penjualan">Penjualan</SelectItem>
                                  <SelectItem value="Modal">Modal</SelectItem>
                                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="Pembelian">Pembelian Stok</SelectItem>
                                  <SelectItem value="Gaji">Gaji</SelectItem>
                                  <SelectItem value="Listrik">Listrik</SelectItem>
                                  <SelectItem value="Air">Air</SelectItem>
                                  <SelectItem value="Sewa">Sewa</SelectItem>
                                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Jumlah</Label>
                          <Input type="number" value={cashJumlah} onChange={(e) => setCashJumlah(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan</Label>
                          <Input value={cashKeterangan} onChange={(e) => setCashKeterangan(e.target.value)} />
                        </div>
                        <Button onClick={handleCreateCashFlow} className="w-full">Simpan</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-500">Pemasukan</p>
                      <p className="text-lg font-bold text-green-600">{formatRupiah(totalMasuk)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-500">Pengeluaran</p>
                      <p className="text-lg font-bold text-red-600">{formatRupiah(totalKeluar)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-500">Saldo</p>
                      <p className="text-lg font-bold text-blue-600">{formatRupiah(saldoKas)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cash Flow List */}
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="hidden sm:table-cell">Keterangan</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashFlow.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell>{formatDate(c.tanggal)}</TableCell>
                              <TableCell>{c.kategori}</TableCell>
                              <TableCell className="hidden sm:table-cell">{c.keterangan || '-'}</TableCell>
                              <TableCell className={`text-right font-semibold ${c.tipe === 'MASUK' ? 'text-green-600' : 'text-red-600'}`}>
                                {c.tipe === 'MASUK' ? '+' : '-'}{formatRupiah(c.jumlah)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {cashFlow.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                Belum ada data arus kas
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Laporan Tab */}
              <TabsContent value="laporan" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Laporan Laba Rugi</h2>
                    <p className="text-gray-500 text-sm">Analisis profitabilitas bisnis</p>
                  </div>
                </div>

                {/* Date Filter */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="space-y-2 flex-1">
                        <Label>Dari Tanggal</Label>
                        <Input type="date" value={laporanDariTanggal} onChange={(e) => setLaporanDariTanggal(e.target.value)} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label>Sampai Tanggal</Label>
                        <Input type="date" value={laporanSampaiTanggal} onChange={(e) => setLaporanSampaiTanggal(e.target.value)} />
                      </div>
                      <Button onClick={() => {
                        // Calculate profit data based on date filter
                        const filteredTransaksi = transaksi.filter(t => {
                          const tgl = new Date(t.tanggal).toISOString().split('T')[0]
                          return (!laporanDariTanggal || tgl >= laporanDariTanggal) && 
                                 (!laporanSampaiTanggal || tgl <= laporanSampaiTanggal)
                        })

                        // Calculate totals
                        const totalPenjualan = filteredTransaksi.reduce((sum, t) => sum + t.total, 0)
                        const totalHpp = filteredTransaksi.reduce((sum, t) => {
                          return sum + t.detailTransaksi.reduce((dSum, dt) => {
                            const prod = dt.produk
                            return dSum + (prod.hargaBeli * dt.jumlah)
                          }, 0)
                        }, 0)
                        const labaKotor = totalPenjualan - totalHpp

                        // Calculate daily data
                        const dailyMap: Record<string, { penjualan: number; hpp: number }> = {}
                        filteredTransaksi.forEach(t => {
                          const date = new Date(t.tanggal).toISOString().split('T')[0]
                          if (!dailyMap[date]) dailyMap[date] = { penjualan: 0, hpp: 0 }
                          dailyMap[date].penjualan += t.total
                          dailyMap[date].hpp += t.detailTransaksi.reduce((sum, dt) => sum + (dt.produk.hargaBeli * dt.jumlah), 0)
                        })
                        const dailyData = Object.entries(dailyMap)
                          .map(([date, data]) => ({ date, ...data, laba: data.penjualan - data.hpp }))
                          .sort((a, b) => a.date.localeCompare(b.date))

                        // Calculate product profitability
                        const productMap: Record<string, { nama: string; qty: number; penjualan: number; hpp: number }> = {}
                        filteredTransaksi.forEach(t => {
                          t.detailTransaksi.forEach(dt => {
                            if (!productMap[dt.produkId]) {
                              productMap[dt.produkId] = { nama: dt.produk.nama, qty: 0, penjualan: 0, hpp: 0 }
                            }
                            productMap[dt.produkId].qty += dt.jumlah
                            productMap[dt.produkId].penjualan += dt.subtotal
                            productMap[dt.produkId].hpp += dt.produk.hargaBeli * dt.jumlah
                          })
                        })
                        const productData = Object.entries(productMap)
                          .map(([produkId, data]) => ({ produkId, ...data, laba: data.penjualan - data.hpp }))
                          .sort((a, b) => b.laba - a.laba)

                        setLaporanLaba({
                          totalPenjualan,
                          totalHpp,
                          labaKotor,
                          labaBersih: labaKotor, // Simplified - could add expenses
                          dailyData,
                          productData
                        })
                      }}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Laporan
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Profit Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Penjualan</div>
                      <div className="text-xl font-bold text-blue-600">{formatRupiah(laporanLaba?.totalPenjualan || totalPenjualan)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">HPP (Harga Pokok)</div>
                      <div className="text-xl font-bold text-orange-600">{formatRupiah(laporanLaba?.totalHpp || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Laba Kotor</div>
                      <div className="text-xl font-bold text-green-600">{formatRupiah(laporanLaba?.labaKotor || 0)}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Margin: {laporanLaba?.totalPenjualan ? ((laporanLaba.labaKotor / laporanLaba.totalPenjualan) * 100).toFixed(1) : 0}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Jumlah Transaksi</div>
                      <div className="text-xl font-bold">{transaksi.length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily Profit Chart */}
                {laporanLaba && laporanLaba.dailyData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Trend Laba Harian
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{ 
                        penjualan: { label: 'Penjualan', color: '#3b82f6' },
                        hpp: { label: 'HPP', color: '#f97316' },
                        laba: { label: 'Laba', color: '#22c55e' }
                      }} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={laporanLaba.dailyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="penjualan" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="hpp" stroke="#f97316" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="laba" stroke="#22c55e" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Product Profitability Table */}
                {laporanLaba && laporanLaba.productData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profitabilitas per Produk</CardTitle>
                      <CardDescription>Produk dengan laba tertinggi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produk</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Penjualan</TableHead>
                              <TableHead className="text-right">HPP</TableHead>
                              <TableHead className="text-right">Laba</TableHead>
                              <TableHead className="text-right">Margin</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {laporanLaba.productData.map((p) => (
                              <TableRow key={p.produkId}>
                                <TableCell className="font-medium">{p.nama}</TableCell>
                                <TableCell className="text-right">{p.qty}</TableCell>
                                <TableCell className="text-right">{formatRupiah(p.penjualan)}</TableCell>
                                <TableCell className="text-right text-orange-600">{formatRupiah(p.hpp)}</TableCell>
                                <TableCell className="text-right font-semibold text-green-600">{formatRupiah(p.laba)}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={p.laba > 0 ? 'default' : 'destructive'}>
                                    {p.penjualan > 0 ? ((p.laba / p.penjualan) * 100).toFixed(1) : 0}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Default Charts when no filter applied */}
                {!laporanLaba && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Trend Penjualan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={{ total: { label: 'Total', color: '#3b82f6' } }} className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis tickFormatter={(value) => `${(value/1000000).toFixed(1)}jt`} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Top 5 Produk Terlaris</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {topProducts.slice(0, 5).map((product, index) => (
                            <div key={product.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                  {index + 1}
                                </span>
                                <span className="text-sm">{product.nama}</span>
                              </div>
                              <span className="font-semibold text-sm">{formatRupiah(product.total)}</span>
                            </div>
                          ))}
                          {topProducts.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Belum ada data</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Backup Tab */}
              <TabsContent value="backup" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Backup & Restore Data</h2>
                    <p className="text-gray-500 text-sm">Export dan import data ke/dari file</p>
                  </div>
                </div>

                {/* Export Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-blue-600" />
                      Export Data
                    </CardTitle>
                    <CardDescription>Download data ke file untuk backup atau migrasi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Export Excel */}
                      <Button 
                        onClick={async () => {
                          try {
                            toast.info('Mengunduh data...')
                            const response = await fetch('/api/backup-excel')
                            const data = await response.json()
                            
                            // Create XLSX using SheetJS-like approach
                            const XLSX = await import('xlsx')
                            const wb = XLSX.utils.book_new()
                            
                            // Add each sheet
                            Object.entries(data.sheets).forEach(([name, sheetData]: [string, any]) => {
                              if (sheetData.length > 0) {
                                const ws = XLSX.utils.json_to_sheet(sheetData)
                                XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31))
                              }
                            })
                            
                            // Download
                            XLSX.writeFile(wb, `POS_Backup_${new Date().toISOString().split('T')[0]}.xlsx`)
                            toast.success('File Excel berhasil diunduh!')
                          } catch (error) {
                            console.error(error)
                            toast.error('Gagal mengekspor ke Excel')
                          }
                        }}
                        className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-green-600 to-green-700"
                      >
                        <FileSpreadsheet className="w-6 h-6" />
                        <span>Backup Excel</span>
                        <span className="text-xs opacity-80">Semua data (XLSX)</span>
                      </Button>
                      
                      {/* Export All JSON */}
                      <Button 
                        onClick={handleExportAll}
                        className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-blue-600 to-blue-700"
                      >
                        <Archive className="w-6 h-6" />
                        <span>Backup JSON</span>
                        <span className="text-xs opacity-80">Semua data (JSON)</span>
                      </Button>
                      
                      {/* Export Pelanggan */}
                      <Button 
                        onClick={handleExportPelanggan}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                      >
                        <Users className="w-6 h-6 text-green-600" />
                        <span>Data Pelanggan</span>
                        <span className="text-xs text-gray-500">{pelanggan.length} data (CSV)</span>
                      </Button>
                      
                      {/* Export Produk */}
                      <Button 
                        onClick={handleExportProduk}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                      >
                        <Package className="w-6 h-6 text-orange-600" />
                        <span>Data Produk & Stok</span>
                        <span className="text-xs text-gray-500">{produk.length} data (CSV)</span>
                      </Button>
                      
                      {/* Export Transaksi */}
                      <Button 
                        onClick={handleExportTransaksi}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                      >
                        <ShoppingCart className="w-6 h-6 text-purple-600" />
                        <span>Data Penjualan</span>
                        <span className="text-xs text-gray-500">{transaksi.length} transaksi (CSV)</span>
                      </Button>
                      
                      {/* Export Cash Flow */}
                      <Button 
                        onClick={handleExportCashFlow}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                      >
                        <Wallet className="w-6 h-6 text-indigo-600" />
                        <span>Laporan Keuangan</span>
                        <span className="text-xs text-gray-500">{cashFlow.length} record (CSV)</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pembelian per Pelanggan Report */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Pembelian per Pelanggan
                    </CardTitle>
                    <CardDescription>Ringkasan jumlah pembelian per pelanggan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Pelanggan</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead className="text-right">Total Transaksi</TableHead>
                            <TableHead className="text-right">Total Qty</TableHead>
                            <TableHead className="text-right">Total Nilai</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const pelangganMap: Record<string, { nama: string; noPelanggan: string; totalTransaksi: number; totalQty: number; totalNilai: number }> = {}
                            
                            transaksi.forEach(t => {
                              if (!t.pelangganId) return
                              const pel = pelanggan.find(p => p.id === t.pelangganId)
                              if (!pel) return
                              
                              if (!pelangganMap[t.pelangganId]) {
                                pelangganMap[t.pelangganId] = {
                                  nama: pel.nama,
                                  noPelanggan: pel.noPelanggan || '-',
                                  totalTransaksi: 0,
                                  totalQty: 0,
                                  totalNilai: 0
                                }
                              }
                              
                              pelangganMap[t.pelangganId].totalTransaksi++
                              pelangganMap[t.pelangganId].totalNilai += t.total || 0
                              
                              t.detailTransaksi.forEach(dt => {
                                pelangganMap[t.pelangganId].totalQty += dt.jumlah
                              })
                            })
                            
                            return Object.entries(pelangganMap)
                              .sort((a, b) => b[1].totalNilai - a[1].totalNilai)
                              .map(([id, data]) => (
                                <TableRow key={id}>
                                  <TableCell className="font-mono text-blue-600">{data.noPelanggan}</TableCell>
                                  <TableCell className="font-medium">{data.nama}</TableCell>
                                  <TableCell className="text-right">{data.totalTransaksi}</TableCell>
                                  <TableCell className="text-right">{data.totalQty}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">{formatRupiah(data.totalNilai)}</TableCell>
                                </TableRow>
                              ))
                          })()}
                          {transaksi.filter(t => t.pelangganId).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                Belum ada data transaksi pelanggan
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Import Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-green-600" />
                      Import Data
                    </CardTitle>
                    <CardDescription>Upload file untuk restore atau migrasi data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Import Backup Lengkap */}
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        <FileJson className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                        <p className="font-medium text-sm mb-2">Backup Lengkap</p>
                        <p className="text-xs text-gray-500 mb-3">JSON - Restore semua data</p>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJSON}
                            className="hidden"
                          />
                          <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200">
                            <Upload className="w-4 h-4 mr-1" />
                            Pilih File
                          </span>
                        </label>
                      </div>
                      
                      {/* Import Pelanggan */}
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-green-600 mb-2" />
                        <p className="font-medium text-sm mb-2">Data Pelanggan</p>
                        <p className="text-xs text-gray-500 mb-3">CSV - Tambah pelanggan</p>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleImportPelangganCSV}
                            className="hidden"
                          />
                          <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200">
                            <Upload className="w-4 h-4 mr-1" />
                            Pilih File
                          </span>
                        </label>
                      </div>
                      
                      {/* Import Produk */}
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                        <p className="font-medium text-sm mb-2">Data Produk</p>
                        <p className="text-xs text-gray-500 mb-3">CSV - Tambah produk</p>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleImportProdukCSV}
                            className="hidden"
                          />
                          <span className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200">
                            <Upload className="w-4 h-4 mr-1" />
                            Pilih File
                          </span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <HardDrive className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">Cara Backup ke Google Drive</p>
                        <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                          <li>Klik "Backup Lengkap" untuk download file JSON</li>
                          <li>Buka Google Drive di browser atau aplikasi</li>
                          <li>Upload file backup ke folder yang diinginkan</li>
                          <li>Untuk restore, download file dari Google Drive lalu import</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Users className="w-6 h-6 mx-auto text-green-600 mb-1" />
                      <p className="text-xl font-bold">{pelanggan.length}</p>
                      <p className="text-xs text-gray-500">Pelanggan</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Package className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                      <p className="text-xl font-bold">{produk.length}</p>
                      <p className="text-xs text-gray-500">Produk</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <ShoppingCart className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-xl font-bold">{transaksi.length}</p>
                      <p className="text-xs text-gray-500">Transaksi</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <Wallet className="w-6 h-6 mx-auto text-indigo-600 mb-1" />
                      <p className="text-xl font-bold">{cashFlow.length}</p>
                      <p className="text-xs text-gray-500">Cash Flow</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      {/* Nota Dialog */}
      <Dialog open={showNotaDialog} onOpenChange={setShowNotaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nota Transaksi</DialogTitle>
          </DialogHeader>
          {selectedNota && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">POS APPSHEET</h3>
                <p className="text-sm text-gray-500">Sistem Manajemen Keuangan</p>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-mono">{selectedNota.noNota}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatDate(selectedNota.tanggal)}</span>
                </div>
                {selectedNota.pelanggan && (
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span>{selectedNota.pelanggan.nama}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                {selectedNota.detailTransaksi.map((dt) => (
                  <div key={dt.id} className="text-sm">
                    <div className="flex justify-between">
                      <span>{dt.produk.nama}</span>
                      <span>{dt.jumlah} x {formatRupiah(dt.harga)}</span>
                    </div>
                    <div className="flex justify-end text-gray-600">
                      {formatRupiah(dt.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedNota.subtotal)}</span>
                </div>
                {selectedNota.diskon > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedNota.diskon)}</span>
                  </div>
                )}
                {selectedNota.pajak > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak:</span>
                    <span>{formatRupiah(selectedNota.pajak)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatRupiah(selectedNota.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar:</span>
                  <span>{formatRupiah(selectedNota.bayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali:</span>
                  <span>{formatRupiah(selectedNota.kembalian)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <Badge variant={selectedNota.metodePembayaran === 'CASH' ? 'default' : 'secondary'}>
                    {selectedNota.metodePembayaran}
                  </Badge>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>Terima Kasih Atas Kunjungan Anda</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar</p>
              </div>
              <Button onClick={handlePrintNota} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Cetak Nota
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
