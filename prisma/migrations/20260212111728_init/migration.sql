-- CreateTable
CREATE TABLE "Pelanggan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Produk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "hargaBeli" REAL NOT NULL,
    "hargaJual" REAL NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "kategori" TEXT,
    "deskripsi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noNota" TEXT NOT NULL,
    "pelangganId" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL,
    "diskon" REAL NOT NULL DEFAULT 0,
    "pajak" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "bayar" REAL NOT NULL,
    "kembalian" REAL NOT NULL DEFAULT 0,
    "metodePembayaran" TEXT NOT NULL DEFAULT 'CASH',
    "status" TEXT NOT NULL DEFAULT 'LUNAS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaksi_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetailTransaksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaksiId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetailTransaksi_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "Transaksi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetailTransaksi_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hutang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pelangganId" TEXT NOT NULL,
    "transaksiId" TEXT NOT NULL,
    "totalHutang" REAL NOT NULL,
    "sisaHutang" REAL NOT NULL,
    "jatuhTempo" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hutang_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hutang_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "Transaksi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PembayaranHutang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hutangId" TEXT NOT NULL,
    "jumlah" REAL NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PembayaranHutang_hutangId_fkey" FOREIGN KEY ("hutangId") REFERENCES "Hutang" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashFlow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipe" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "jumlah" REAL NOT NULL,
    "keterangan" TEXT,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Produk_barcode_key" ON "Produk"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Transaksi_noNota_key" ON "Transaksi"("noNota");

-- CreateIndex
CREATE UNIQUE INDEX "Hutang_transaksiId_key" ON "Hutang"("transaksiId");
