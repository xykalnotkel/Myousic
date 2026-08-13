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
    <aside className="fixed top-0 left-0 bottom-0 w-56 z-30 bg-black border-r border-white/8 hidden md:flex flex-col p-4">
      <Link href="/" className="flex items-center gap-2.5 px-2 py-2 mb-6">
        <Logo size={36} className="text-white rounded-[10px] ring-1 ring-white/15" />
        <div>
          <div className="font-extrabold tracking-tight leading-none">{BRAND}</div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-mut mt-1">Music</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                active ? "text-black bg-white" : "text-mut hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon d={n.icon} size={20} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
