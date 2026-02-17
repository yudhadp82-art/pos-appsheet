import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export const metadata: Metadata = {
  title: "POS AppSheet - Sistem Manajemen Keuangan Lengkap",
  description: "Aplikasi Point of Sale dengan manajemen pelanggan, produk, transaksi, hutang, kas, dan laporan keuangan. Dilengkapi dengan barcode scanner dan cetak nota.",
  keywords: ["POS", "Point of Sale", "Manajemen Keuangan", "Kasir", "Invoice", "Hutang", "Laporan", "Next.js", "TypeScript"],
  authors: [{ name: "POS AppSheet Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "POS AppSheet",
    description: "Sistem Manajemen Keuangan Lengkap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "POS AppSheet",
    description: "Sistem Manajemen Keuangan Lengkap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="POS AppSheet" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
