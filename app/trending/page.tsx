import { search, SearchType } from "@/lib/scraper/search";
import TrackList from "@/components/TrackList";
import { TRENDING_SONGS } from "@/lib/data";
import type { Track } from "@/lib/types";

export const revalidate = 3600;

export default async function TrendingPage() {
  // cari tiap lagu ke YouTube Music, ambil hasil terbaik
  const settled = await Promise.allSettled(
    TRENDING_SONGS.map((s) => search(SearchType.SONGS, `${s.artist} ${s.title}`))
  );

  const tracks: Track[] = [];
  const foundIdx: number[] = [];
  settled.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const first = r.value[0];
    if (first?.id && first?.title) {
      tracks.push({
        id: first.id,
        title: first.title ?? TRENDING_SONGS[i].title,
        artist: first.artist ?? TRENDING_SONGS[i].artist,
        duration: first.duration,
        durationText: first.durationText,
        thumbnails: first.thumbnails,
        plays: first.plays,
      });
      foundIdx.push(i);
    }
  });

  const foundCount = foundIdx.length;

  return (
    <div>
      {/* banner */}
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-line bg-white/[0.02] mb-8 min-h-[220px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/speaker-notes.webp"
          alt=""
          aria-hidden
          className="absolute -right-6 -bottom-8 w-64 sm:w-80 opacity-90 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/70 to-transparent" />
        <div className="relative p-8 md:p-12 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-mut mb-3">🔥 Trending Indonesia</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-glow leading-tight">
            Sedang ramai
            <br />
            diputar di Tanah Air
          </h1>
          <p className="mt-4 text-mut text-sm leading-relaxed">
            Campuran lagu lokal &amp; internasional yang lagi naik daun — dari Sal Priadi sampai
            Sabrina Carpenter. {foundCount > 0 && `${foundCount} lagu siap diputar.`}
          </p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="text-mut text-sm py-16 text-center">
          Gagal memuat daftar trending. Coba lagi nanti.
        </div>
      ) : (
        <TrackList tracks={tracks} />
      )}

      <p className="text-[11px] text-mut/60 mt-6">
        Daftar dikurasi manual, dicocokkan otomatis ke YouTube Music. Urutan tidak selalu aktual.
      </p>
    </div>
  );
}
