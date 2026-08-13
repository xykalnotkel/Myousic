"use client";

import Link from "next/link";
import { usePlayer } from "./PlayerProvider";
import Sidebar from "./Sidebar";
import PlayerBar from "./PlayerBar";
import { Icon, I } from "./ui";
import Logo from "./Logo";
import { BRAND } from "@/lib/brand";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const { fullOpen } = usePlayer();

  return (
    <div className="relative min-h-screen">
      {!fullOpen && (
        <header className="md:hidden sticky top-0 z-30 bg-black/90 border-b border-white/8 px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Logo size={28} className="text-white rounded-[8px] ring-1 ring-white/15" />
            <span className="font-extrabold tracking-tight">{BRAND}</span>
          </Link>
          <Link
            href="/search"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            aria-label="Cari"
          >
            <Icon d={I.search} size={18} />
          </Link>
        </header>
      )}

      {!fullOpen && <Sidebar />}

      <main
        className={`relative z-10 ${fullOpen ? "" : "md:pl-56"} px-4 sm:px-6 md:px-8 pt-4 md:pt-8 ${
          fullOpen ? "pb-0" : "pb-36 md:pb-28"
        } max-w-[1500px]`}
      >
        {children}
      </main>

      <PlayerBar />
    </div>
  );
}
