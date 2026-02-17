# 📱 Android Studio - Download & Install Guide

## 🔗 Download Android Studio

### Download Langsung:
**https://developer.android.com/studio**

---

## 💻 Pilih Sesuai Sistem Operasi:

| OS | Download Link | Ukuran |
|----|---------------|--------|
| **Windows** | https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.13/android-studio-2024.1.1.13-windows.exe | ~1.1 GB |
| **Mac (Intel)** | https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.13/android-studio-2024.1.1.13-mac.dmg | ~1.1 GB |
| **Mac (M1/M2/M3)** | https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.13/android-studio-2024.1.1.13-mac_arm.dmg | ~1.1 GB |
| **Linux** | https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.1.1.13/android-studio-2024.1.1.13-linux.tar.gz | ~1.1 GB |

---

## 📋 Step-by-Step Install

### Windows:
1. Download file `.exe`
2. Double-click untuk menjalankan installer
3. Klik **Next** → **Next** → **Install**
4. Tunggu proses install selesai
5. Centang **"Start Android Studio"** → **Finish**
6. Pilih **Standard** install type
7. Tunggu download SDK selesai

### Mac:
1. Download file `.dmg`
2. Buka file DMG
3. Drag **Android Studio** ke folder **Applications**
4. Buka Android Studio dari Applications
5. Pilih **Standard** install type
6. Tunggu download SDK selesai

### Linux:
```bash
# Extract file tar.gz
tar -xzf android-studio-*.tar.gz

# Jalankan
cd android-studio/bin
./studio.sh
```

---

## 🔨 Build APK di Android Studio

Setelah Android Studio terinstall:

### Langkah 1: Buka Project
1. Buka Android Studio
2. Klik **Open** (atau File → Open)
3. Navigate ke folder `android` dari `pos-appsheet-android.zip`
4. Klik **OK**
5. Tunggu Gradle sync (pertama kali mungkin 5-10 menit)

### Langkah 2: Build APK
1. Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Tunggu proses build
3. Klik **locate** di popup notifikasi
4. File APK: `app-debug.apk`

### Langkah 3: Install di HP
1. Copy APK ke HP Android
2. Buka file manager
3. Tap APK untuk install

---

## ⚠️ Troubleshooting

### Error: "Gradle sync failed"
**Solusi:**
- Pastikan koneksi internet stabil
- Klik **File** → **Invalidate Caches** → **Invalidate and Restart**

### Error: "SDK not found"
**Solusi:**
- Klik **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
- Klik **Edit** di lokasi SDK
- Ikuti wizard untuk download SDK

### Error: "JDK not found"
**Solusi:**
- Android Studio sudah include JDK
- Jika error: **File** → **Settings** → **Build** → **Gradle** → pilih **jbr-17**

---

## 📱 Minimum Requirements

| Komponen | Minimum |
|----------|---------|
| RAM | 8 GB (16 GB recommended) |
| Disk Space | 8 GB (untuk Android Studio + SDK) |
| OS | Windows 10/11, macOS 10.14+, Linux |
| Screen | 1280 x 800 minimum |

---

## 🎯 Versi Android Studio yang Direkomendasikan

**Android Studio Hedgehog | 2024.1.1** atau versi terbaru

---

## 📞 Butuh Bantuan?

Jika ada error saat build, copy-paste error message dan saya akan bantu solve!
