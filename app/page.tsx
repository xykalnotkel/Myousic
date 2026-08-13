import Link from "next/link";
import { retrieveSuggestions } from "@/lib/scraper/suggestions";
import { search, SearchType } from "@/lib/scraper/search";
import { Cover } from "@/components/ui";
import { pickThumb } from "@/lib/thumbs";
import BannerSlider, { type Slide } from "@/components/BannerSlider";
import { BRAND, TAGLINE } from "@/lib/brand";
import { INDO_ARTISTS } from "@/lib/data";

export const revalidate = 3600;

async function fetchIndoArtists() {
  const seeds = INDO_ARTISTS.slice(0, 10);
  const results = await Promise.allSettled(
    seeds.map(async (a) => {
      const found = await search(SearchType.ARTISTS, a.query);
      const first = found[0];
      if (!first?.browseId) return null;
      return {
        title: a.name,
        browseId: a.browseId || first.browseId,
        subscribers: first.subscribers,
        thumbnails: first.thumbnails,
      };
    })
  );
  const seen = new Set<string>();
  const artists: { title: string; browseId: string; subscribers?: string; thumbnails?: string[] }[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value?.browseId) continue;
    if (seen.has(r.value.browseId)) continue;
    seen.add(r.value.browseId);
    artists.push(r.value);
    if (artists.length >= 12) break;
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

  const slides: Slide[] = [
    {
      href: "/search",
      kicker: `${BRAND} · est. 2026`,
      title: TAGLINE,
      text: "Cari jutaan lagu, putar dengan visualizer yang mengikuti beat, mesin suara (reverb & bass), dan playlist-mu sendiri.",
      cta: "Mulai mencari",
      image: "/illustrations/vinyl-wave.webp",
    },
    {
      href: "/trending",
      kicker: "Trending Indonesia",
      title: "Sedang ramai diputar",
      text: "Lagu lokal yang lagi naik daun — siap diputar tanpa akun.",
      cta: "Lihat trending",
      image: "/illustrations/radio-galaxy.webp",
    },
    {
      href: indoArtists[0] ? `/artist/${indoArtists[0].browseId}` : "/artists",
      kicker: "Artis Tanah Air",
      title: indoArtists[0]?.title ? `Fokus: ${indoArtists[0].title}` : "Artis Indonesia",
      text: "Wajah bulat, kurasi lokal — Tulus, Bernadya, Hindia, Noah, dan yang lagi hangat.",
      cta: "Jelajah artis",
      image: pickThumb(indoArtists[0]?.thumbnails, 480) || "/illustrations/mic-bloom.webp",
    },
    {
      href: suggestions[0]?.browseId ? `/playlist/${suggestions[0].browseId}` : "/playlists",
      kicker: "Playlist pilihan",
      title: suggestions[0]?.title || "Buat playlist-mu",
      text: "Simpan lagu favorit ke playlist lokal — tanpa login, tetap di perangkatmu.",
      cta: suggestions[0] ? "Buka playlist" : "Playlist saya",
      image: pickThumb(suggestions[0]?.thumbnails, 480) || "/illustrations/cassette-garden.webp",
    },
  ];

  return (
    <div>
      <BannerSlider slides={slides} />

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Rekomendasi untukmu</h2>
            <p className="text-mut text-sm mt-1">Playlist pilihan YouTube Music</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-mut hidden sm:block">
            geser untuk lihat lebih banyak
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
                  src={pickThumb(s.thumbnails, 240)}
                  title={s.title}
                  size={176}
                  className="w-full aspect-square"
                  rounded="rounded-lg"
                />
                <p className="mt-3 text-sm font-semibold truncate">{s.title}</p>
                <p className="text-xs text-mut mt-0.5">Playlist</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {indoArtists.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Artis Indonesia</h2>
              <p className="text-mut text-sm mt-1">Wajah bulat — yang sedang populer di Tanah Air</p>
            </div>
            <Link href="/artists" className="text-xs text-mut hover:text-white transition-colors underline underline-offset-4">
              Lihat semua
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {indoArtists.map((a, i) => (
              <Link
                key={`${a.browseId}-${i}`}
                href={`/artist/${a.browseId}`}
                className="group flex flex-col items-center text-center"
              >
                <Cover
                  src={pickThumb(a.thumbnails, 240)}
                  title={a.title}
                  size={112}
                  circle
                  className="ring-2 ring-white/10 group-hover:ring-white/40 transition-all w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
                  sizeClass="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
                />
                <p className="mt-2.5 text-sm font-semibold truncate w-full">{a.title}</p>
                <p className="text-[11px] text-mut truncate w-full">{a.subscribers || "Artis"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
