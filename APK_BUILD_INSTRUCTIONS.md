# POS AppSheet - Android APK Build Instructions

## 📱 Project Overview

POS AppSheet adalah aplikasi Point of Sale lengkap dengan fitur:
- ✅ Manajemen Pelanggan
- ✅ Manajemen Produk dengan Barcode
- ✅ Transaksi Penjualan (Cash/Hutang)
- ✅ Manajemen Hutang
- ✅ Arus Kas
- ✅ Laporan Keuangan
- ✅ Cetak Nota

## 🔨 Build APK Locally

### Prerequisites

1. **Install Android Studio** (recommended) atau Android SDK
   - Download: https://developer.android.com/studio
   - Set `ANDROID_HOME` environment variable

2. **Install JDK 17+**
   ```bash
   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk
   
   # macOS
   brew install openjdk@17
   
   # Windows - download dari adoptium.net
   ```

### Build Steps

1. **Open terminal in project directory**

2. **Sync web assets**
   ```bash
   bunx cap sync android
   ```

3. **Build APK**

   **Option A: Using Android Studio (Recommended)**
   ```bash
   # Open in Android Studio
   bunx cap open android
   ```
   Then in Android Studio:
   - Build > Build Bundle(s) / APK(s) > Build APK(s)
   - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

   **Option B: Using Command Line**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK (Signed)

1. **Generate keystore**
   ```bash
   keytool -genkey -v -keystore pos-appsheet.keystore -alias pos-appsheet -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/key.properties`**
   ```properties
   storePassword=YOUR_PASSWORD
   keyPassword=YOUR_PASSWORD
   keyAlias=pos-appsheet
   storeFile=../pos-appsheet.keystore
   ```

3. **Update `android/app/build.gradle`**
   Add before `android {`:
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```
   
   Replace `signingConfigs` with:
   ```gradle
   signingConfigs {
       release {
           keyAlias keystoreProperties['keyAlias']
           keyPassword keystoreProperties['keyPassword']
           storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
           storePassword keystoreProperties['storePassword']
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
           proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
   }
   ```

4. **Build release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## 📲 Install APK on Android Device

1. **Transfer APK** to your Android device
   - Via USB cable
   - Via cloud storage (Google Drive, etc.)
   - Via email to yourself

2. **Enable Unknown Sources**
   - Settings > Security > Unknown Sources (enable)

3. **Install APK**
   - Open file manager
   - Navigate to APK file
   - Tap to install

## 🌐 PWA Installation (Alternative)

Jika tidak ingin build APK, aplikasi bisa diinstall sebagai PWA:

1. **Buka aplikasi di browser** (Chrome/Edge)
2. **Tap menu** (⋮ di pojok kanan atas)
3. **Pilih "Add to Home Screen"** atau "Install App"
4. **Aplikasi akan terinstall** seperti native app

## 📁 Project Structure

```
/home/z/my-project/
├── android/                 # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/  # Web assets
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── gradlew
├── out/                     # Static web export
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── app/
│   │   ├── page.tsx         # Main app (all features)
│   │   └── layout.tsx
│   └── lib/
│       └── db-mobile.ts     # IndexedDB database
├── capacitor.config.ts
└── package.json
```

## 🔧 Troubleshooting

### Java Version Error
```bash
# Check Java version
java -version
# Should be 17 or higher

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### Android SDK Not Found
```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Gradle Permission Denied
```bash
chmod +x android/gradlew
```

## 📞 Support

Untuk pertanyaan atau bantuan, hubungi developer.

---

**POS AppSheet v1.0** - Sistem Manajemen Keuangan Lengkap
