"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, I } from "./ui";

const NAV = [
  { href: "/", label: "Beranda", icon: I.home, match: (p: string) => p === "/" },
  { href: "/search", label: "Cari", icon: I.search, match: (p: string) => p.startsWith("/search") },
  { href: "/trending", label: "Trending", icon: I.trending, match: (p: string) => p.startsWith("/trending") },
  { href: "/artists", label: "Artis", icon: I.user, match: (p: string) => p.startsWith("/artist") },
  { href: "/playlists", label: "Playlist", icon: I.playlist, match: (p: string) => p.startsWith("/playlist") },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden border-t border-white/8 bg-black">
      <div className="grid grid-cols-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map((n) => {
          const on = n.match(pathname);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold ${
                on ? "text-white" : "text-[#7a7a7a]"
              }`}
            >
              <Icon d={n.icon} size={22} />
              {n.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
