import Link from "next/link";
import { retrieveSuggestions } from "@/lib/scraper/suggestions";
import { search, SearchType } from "@/lib/scraper/search";
import { Cover, Icon, I } from "@/components/ui";
import { bestThumb } from "@/lib/types";
import Visualizer from "@/components/Visualizer";
import { BRAND, TAGLINE } from "@/lib/brand";

export const revalidate = 3600;

// Artis Indonesia yang terkenal — dicari otomatis ke YouTube Music
const INDONESIAN_ARTISTS = [
  "Tulus",
  "Raisa",
  "Noah",
  "Dewa 19",
  "Isyana Sarasvati",
  "Pamungkas",
  "Nadin Amizah",
  "Hindia",
  "Rizky Febian",
  "Fiersa Besari",
  "Mahalini",
  "Kangen Band",
];

async function fetchIndoArtists() {
  const results = await Promise.allSettled(
    INDONESIAN_ARTISTS.map((name) => search(SearchType.ARTISTS, name))
  );
  const seen = new Set<string>();
  const artists: { title: string; browseId: string; subscribers?: string; thumbnails?: string[] }[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const first = r.value[0];
    if (!first?.browseId || seen.has(first.browseId)) continue;
    seen.add(first.browseId);
    artists.push({
      title: first.title ?? "",
      browseId: first.browseId,
      subscribers: first.subscribers,
      thumbnails: first.thumbnails,
    });
    if (artists.length >= 8) break;
  }
  return artists;
}

export default async function Home() {
  let suggestions: Awaited<ReturnType<typeof retrieveSuggestions>> = [];
  try {
    suggestions = await retrieveSuggestions();
  } catch (e) {
    console.error("suggestions gagal:", e);
  }

  let indoArtists: Awaited<ReturnType<typeof fetchIndoArtists>> = [];
  try {
    indoArtists = await fetchIndoArtists();
  } catch (e) {
    console.error("artis indo gagal:", e);
  }

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl ring-1 ring-line bg-white/[0.02] px-8 py-14 md:px-14 md:py-20 mb-12 min-h-[340px] md:min-h-[400px]">
        {/* ular morphing ambient */}
        <Visualizer variant="snake" demo className="absolute inset-0 w-full h-full opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/85 via-[#050505]/40 to-transparent" />
        <div
          aria-hidden
          className="absolute -top-40 -right-24 w-[420px] h-[420px] rounded-full bg-white blur-[110px] opacity-[0.07] animate-pulse"
        />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.4em] text-mut mb-4">
            {BRAND} · est. 2026
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-glow">
            {TAGLINE}
          </h1>
          <p className="mt-5 text-mut max-w-md text-[15px] leading-relaxed">
            Cari jutaan lagu dari YouTube Music, putar dengan visualizer ular morphing
            yang menari mengikuti beat — tanpa akun, tanpa iklan.
          </p>
          <Link
            href="/search"
            className="mt-8 inline-flex items-center gap-3 bg-white text-black font-bold px-7 py-3.5 rounded-full hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            <Icon d={I.search} size={18} />
            Mulai mencari
          </Link>
        </div>
      </section>

      {/* suggestions */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Rekomendasi untukmu</h2>
            <p className="text-mut text-sm mt-1">Playlist pilihan YouTube Music</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-mut hidden sm:block">
            ⇦ geser untuk lihat lebih banyak
          </span>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-mut text-sm">Belum bisa memuat rekomendasi. Coba halaman pencarian!</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {suggestions.map((s, i) => (
              <Link
                key={`${s.browseId}-${i}`}
                href={`/playlist/${s.browseId}`}
                className="card-lift shrink-0 w-44 rounded-xl bg-panel ring-1 ring-line p-3"
              >
                <Cover
                  src={bestThumb(s.thumbnails)}
                  title={s.title}
                  size={160}
                  className="w-full aspect-square rounded-lg"
                />
                <p className="mt-3 text-sm font-semibold truncate">{s.title}</p>
                <p className="text-xs text-mut mt-0.5">Playlist</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* banner trending */}
      <section className="mt-12">
        <Link
          href="/trending"
          className="relative overflow-hidden rounded-3xl ring-1 ring-line bg-white/[0.02] block card-lift"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/radio-galaxy.webp"
            alt=""
            aria-hidden
            className="absolute -right-8 -bottom-10 w-60 sm:w-72 opacity-90 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/65 to-transparent" />
          <div className="relative p-7 md:p-9">
            <p className="text-[10px] uppercase tracking-[0.4em] text-mut mb-2">🔥 Trending Indonesia</p>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-glow">
              Sedang ramai diputar
            </h3>
            <p className="text-mut text-sm mt-1.5 max-w-sm">
              Lagu lokal &amp; internasional yang lagi naik daun — campur campur, siap diputar.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 bg-white text-black font-semibold text-xs px-4 py-2 rounded-full">
              Lihat daftar <Icon d={I.next} size={12} />
            </span>
          </div>
        </Link>
      </section>

      {/* artis Indonesia */}
      {indoArtists.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Artis Indonesia</h2>
              <p className="text-mut text-sm mt-1">Yang sedang populer di Tanah Air</p>
            </div>
            <Link href="/search?type=artists" className="text-xs text-mut hover:text-white transition-colors underline underline-offset-4">
              Lihat semua
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {indoArtists.map((a, i) => (
              <Link
                key={`${a.browseId}-${i}`}
                href={`/artist/${a.browseId}`}
                className="card-lift rounded-2xl bg-panel ring-1 ring-line p-4 flex flex-col items-center text-center"
              >
                <Cover
                  src={bestThumb(a.thumbnails)}
                  title={a.title}
                  sizeClass="w-20 h-20 sm:w-24 sm:h-24 rounded-full"
                  className="ring-2 ring-white/10"
                />
                <p className="mt-3 text-sm font-semibold truncate w-full">{a.title}</p>
                <p className="text-[11px] text-mut truncate w-full">{a.subscribers || "Artis"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
