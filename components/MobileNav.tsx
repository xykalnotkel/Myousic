"use client";

// Bottom navigation untuk mobile (desktop memakai Sidebar)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlayer } from "./PlayerProvider";
import { Icon, I, Equalizer } from "./ui";

export default function MobileNav() {
  const pathname = usePathname();
  const { current, playing, openFull } = usePlayer();
  const hasTrack = !!current?.id;

  const item = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-2 text-[9px] font-semibold transition-colors ${
      active ? "text-white" : "text-mut"
    }`;

  return (
    <nav className="fixed bottom-[118px] md:hidden left-0 right-0 z-30 bg-black/95 border-t border-line backdrop-blur-md">
      <div className="grid grid-cols-5 items-stretch">
        <Link href="/" className={item(pathname === "/")}>
          <Icon d={I.home} size={19} />
          Beranda
        </Link>

        <Link href="/trending" className={item(pathname.startsWith("/trending"))}>
          <Icon d={I.trending} size={19} />
          Trending
        </Link>

        <button
          onClick={openFull}
          disabled={!hasTrack}
          className={`${item(hasTrack)} ${hasTrack ? "text-white" : "text-[#333]"} `}
          title="Now Playing"
        >
          {hasTrack ? <Equalizer size={15} active={playing} /> : <Icon d={I.play} size={15} />}
          Now Playing
        </button>

        <Link href="/artists" className={item(pathname.startsWith("/artists"))}>
          <Icon d={I.user} size={19} />
          Artis
        </Link>

        <Link href="/search" className={item(pathname.startsWith("/search"))}>
          <Icon d={I.search} size={19} />
          Cari
        </Link>
      </div>
    </nav>
  );
}
