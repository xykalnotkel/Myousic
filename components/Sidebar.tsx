"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, I } from "./ui";
import Logo from "./Logo";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/", label: "Beranda", icon: I.home },
  { href: "/search", label: "Cari", icon: I.search },
  { href: "/trending", label: "Trending", icon: I.trending },
  { href: "/artists", label: "Artis", icon: I.user },
  { href: "/playlists", label: "Playlist", icon: I.playlist },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 z-30 bg-black/60 border-r border-line hidden md:flex flex-col p-4">
      {/* logo */}
      <Link href="/" className="flex items-center gap-3 px-2 py-3 mb-6 group">
        <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon d={I.music} size={20} />
        </div>
        <div>
          <div className="font-extrabold tracking-tight leading-none">{BRAND}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-mut">Music</div>
        </div>
      </Link>

      {/* nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-[15px] font-semibold transition-colors ${
                active ? "text-white bg-white/10" : "text-mut hover:text-white"
              }`}
            >
              <Icon d={n.icon} size={22} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 py-4 border-t border-line text-[11px] leading-relaxed text-mut">
        <p className="font-semibold text-soft mb-1">{BRAND}</p>
        <p>
          Pemutar musik monokrom berbasis YouTube Music. Metadata via scraper, audio via
          InnerTube.
        </p>
      </div>
    </aside>
  );
}
