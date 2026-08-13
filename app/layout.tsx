import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/components/PlayerProvider";
import Sidebar from "@/components/Sidebar";
import PlayerBar from "@/components/PlayerBar";
import MobileNav from "@/components/MobileNav";
import Blobs from "@/components/Blobs";
import { Icon, I } from "@/components/ui";
import Link from "next/link";
import { BRAND, TAGLINE, APP_DESC } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND} — ${TAGLINE}`,
    template: `%s · ${BRAND}`,
  },
  description: APP_DESC,
  applicationName: BRAND,
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PlayerProvider>
          <div className="relative min-h-screen">
            <Blobs />

            {/* header mobile */}
            <header className="md:hidden sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                  <Icon d={I.music} size={17} />
                </div>
                <div className="leading-none">
                  <div className="font-extrabold tracking-tight">{BRAND}</div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-mut">Music</div>
                </div>
              </Link>
              <Link
                href="/search"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Cari"
              >
                <Icon d={I.search} size={18} />
              </Link>
            </header>

            <Sidebar />
            <main className="relative z-10 md:pl-60 px-4 sm:px-6 md:px-8 pt-6 md:pt-8 pb-[310px] md:pb-44 max-w-[1500px]">
              {children}
            </main>

            <MobileNav />
            <PlayerBar />
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
