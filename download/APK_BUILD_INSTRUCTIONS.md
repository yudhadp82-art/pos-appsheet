# 📱 POS AppSheet - Panduan Build APK Lengkap

## 🚀 Metode Build APK

---

## Metode 1: Menggunakan Android Studio (PALING MUDAH)

### Langkah-langkah:

1. **Download Android Studio**
   - Kunjungi: https://developer.android.com/studio
   - Download untuk Windows/Mac/Linux
   - Install dengan setting default

2. **Buka Project Android**
   - Extract file `pos-appsheet-android.zip`
   - Buka Android Studio
   - Pilih **"Open an Existing Project"**
   - Navigate ke folder `android` yang sudah di-extract
   - Tunggu sampai Gradle sync selesai

3. **Build APK**
   - Di menu atas: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Tunggu proses build selesai
   - Klik **"locate"** di notifikasi untuk menemukan APK
   - Atau cari di: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Transfer APK ke HP**
   - Copy file `app-debug.apk` ke HP
   - Buka file manager di HP
   - Tap file APK untuk install

---

## Metode 2: Menggunakan Command Line (Windows/Mac/Linux)

### Prerequisites:
- **Node.js** (download dari nodejs.org)
- **JDK 17+** (download dari adoptium.net)

### Langkah-langkah:

#### A. Install Dependencies (hanya pertama kali)

```bash
# Install Capacitor CLI global
npm install -g @capacitor/cli

# Masuk ke folder project
cd pos-appsheet-android

# Sync web assets
npx cap sync android
```

#### B. Set Environment Variables (Windows)

```cmd
# Set JAVA_HOME (sesuaikan path instalasi JDK Anda)
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%PATH%;%JAVA_HOME%\bin

# Set ANDROID_HOME (sesuaikan path Android SDK)
set ANDROID_HOME=C:\Users\[Username]\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools
set PATH=%PATH%;%ANDROID_HOME%\tools
```

#### C. Set Environment Variables (Mac/Linux)

```bash
# Add to ~/.bashrc atau ~/.zshrc
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$JAVA_HOME/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

#### D. Build APK

```bash
# Masuk folder android
cd android

# Build debug APK (Windows)
gradlew.bat assembleDebug

# Build debug APK (Mac/Linux)
chmod +x gradlew
./gradlew assembleDebug

# APK akan tersedia di:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Metode 3: Install Bun (Alternatif untuk bunx)

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Mac/Linux
curl -fsSL https://bun.sh/install | bash

# Setelah install, restart terminal, lalu:
bunx cap sync android
```

---

## Metode 4: PWA Installation (TANPA APK)

Jika tidak ingin repot build APK, gunakan PWA:

### Cara Install PWA di Android:

1. **Buka Chrome** di HP Android
2. **Kunjungi URL aplikasi** (jika sudah di-deploy)
3. **Tap menu (⋮)** di pojok kanan atas
4. **Pilih "Add to Home Screen"** atau "Install App"
5. **Aplikasi akan muncul** di home screen seperti app native

### Cara Deploy Web App:

```bash
# Option 1: Vercel (free)
npx vercel --prod

# Option 2: Netlify (free)
# Upload folder 'out' ke netlify.com

# Option 3: GitHub Pages (free)
# Push folder 'out' ke GitHub, enable Pages
```

---

## 📂 File yang Disediakan

| File | Deskripsi |
|------|-----------|
| `pos-appsheet-android.zip` | Project Android siap build |
| `pos-appsheet-web.zip` | Web app statis (untuk PWA) |
| `APK_BUILD_INSTRUCTIONS.md` | File ini |

---

## 🔧 Troubleshooting

### Error: "JAVA_HOME not found"
**Solusi:** Install JDK 17 dari https://adoptium.net

### Error: "ANDROID_HOME not found"
**Solusi:** Install Android Studio, SDK akan terinstall otomatis

### Error: "Gradle permission denied" (Mac/Linux)
**Solusi:** 
```bash
chmod +x android/gradlew
```

### Error: "Keystore not found" (Build Release)
**Solusi:** Debug APK tidak butuh keystore, langsung install saja

### Error: "Unable to locate APK"
**Solusi:** APK ada di `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Install APK di Android

1. **Transfer APK** ke HP Android (via USB/Email/Cloud)
2. **Buka Settings** → **Security**
3. **Enable "Unknown Sources"** atau "Install Unknown Apps"
4. **Buka File Manager** → **Tap APK file**
5. **Tap Install**

---

## 🎉 Fitur Aplikasi

- ✅ Dashboard dengan statistik penjualan
- ✅ Manajemen Pelanggan
- ✅ Manajemen Produk + Barcode
- ✅ Transaksi Penjualan (Cash/Hutang)
- ✅ Manajemen Hutang + Pembayaran
- ✅ Arus Kas (Pemasukan/Pengeluaran)
- ✅ Laporan Keuangan + Grafik
- ✅ Cetak Nota/Struk
- ✅ Data tersimpan OFFLINE

---

**POS AppSheet v1.0** - Sistem Manajemen Keuangan Lengkap
