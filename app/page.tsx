import Link from "next/link";
import { retrieveSuggestions } from "@/lib/scraper/suggestions";
import { search, SearchType } from "@/lib/scraper/search";
import { Cover } from "@/components/ui";
import { pickThumb } from "@/lib/thumbs";
import BannerSlider, { type Slide } from "@/components/BannerSlider";
import RecentRail from "@/components/RecentRail";
import { BRAND, TAGLINE } from "@/lib/brand";
import { INDO_ARTISTS, TRENDING_SONGS, MOODS } from "@/lib/data";
import type { Track } from "@/lib/types";
import SongPlayCard from "@/components/SongPlayCard";

export const revalidate = 3600;
export const maxDuration = 60;

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

async function fetchSongs(query: string, limit = 12): Promise<Track[]> {
  try {
    const found = await search(SearchType.SONGS, query);
    return found
      .filter((x: any) => x?.id && x?.title)
      .slice(0, limit)
      .map((x: any) => ({
        id: x.id,
        title: x.title,
        artist: x.artist,
        duration: x.duration,
        durationText: x.durationText,
        thumbnails: x.thumbnails,
        plays: x.plays,
      }));
  } catch {
    return [];
  }
}

async function fetchTrending(): Promise<Track[]> {
  const slice = TRENDING_SONGS.slice(0, 8);
  const settled = await Promise.allSettled(
    slice.map((s) => search(SearchType.SONGS, `${s.artist} ${s.title}`))
  );
  const tracks: Track[] = [];
  settled.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const first = r.value[0];
    if (!first?.id) return;
    tracks.push({
      id: first.id,
      title: first.title || slice[i].title,
      artist: first.artist || slice[i].artist,
      duration: first.duration,
      durationText: first.durationText,
      thumbnails: first.thumbnails,
    });
  });
  return tracks;
}



export default async function Home() {
  let suggestions: Awaited<ReturnType<typeof retrieveSuggestions>> = [];
  try {
    suggestions = await retrieveSuggestions();
  } catch (e) {
    console.error("suggestions gagal:", e);
  }

  const [indoArtists, trending, sasak] = await Promise.all([
    fetchIndoArtists().catch(() => []),
    fetchTrending().catch(() => []),
    fetchSongs("lagu sasak lombok", 12),
  ]);

  const slides: Slide[] = [
    {
      href: "/search",
      kicker: `${BRAND} · est. 2026`,
      title: TAGLINE,
      text: "Cari lagu, buka fullscreen, baca lirik yang memutih mengikuti beat.",
      cta: "Mulai mencari",
      image: "/illustrations/hero-vinyl.jpg",
    },
    {
      href: "/search?q=lagu%20sasak&type=songs",
      kicker: "Dari Lombok",
      title: "Tembang Sasak malam ini",
      text: "Kurasi NTB — lagu Sasak, Lombok, dan yang biasa diputar di Selong.",
      cta: "Putar Sasak",
      image: "/illustrations/hero-rinjani.jpg",
    },
    {
      href: "/trending",
      kicker: "Trending Indonesia",
      title: "Sedang ramai diputar",
      text: "Yang lagi naik daun di Tanah Air. Satu ketuk, langsung bunyi.",
      cta: "Lihat trending",
      image: "/illustrations/hero-stage.jpg",
    },
    {
      href: indoArtists[0] ? `/artist/${indoArtists[0].browseId}` : "/artists",
      kicker: "Artis Tanah Air",
      title: indoArtists[0]?.title ? `Fokus: ${indoArtists[0].title}` : "Artis Indonesia",
      text: "Tulus, Bernadya, Hindia, Noah — wajah bulat, kurasi lokal.",
      cta: "Jelajah artis",
      image: "/illustrations/hero-headphone.jpg",
    },
    {
      href: suggestions[0]?.browseId ? `/playlist/${suggestions[0].browseId}` : "/playlists",
      kicker: "Satu gelombang",
      title: "Visualizer yang jujur",
      text: "Bukan hiasan. Satu garis dari audio aslinya — kalau stream hidup.",
      cta: suggestions[0] ? "Buka playlist" : "Playlist saya",
      image: "/illustrations/hero-wave.jpg",
    },
  ];

  return (
    <div>
      <BannerSlider slides={slides} />

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-10">
        {MOODS.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="shrink-0 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold"
          >
            {m.label}
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-10">
        {[
          {
            href: "/trending",
            img: "/illustrations/hero-stage.jpg",
            k: "Live now",
            t: "Trending Indo",
          },
          {
            href: "/search?q=lagu%20sasak&type=songs",
            img: "/illustrations/hero-rinjani.jpg",
            k: "NTB",
            t: "Lagu Sasak",
          },
          {
            href: "/search",
            img: "/illustrations/hero-headphone.jpg",
            k: "Cari",
            t: "Judul / artis",
          },
        ].map((c) => (
          <Link
            key={c.t}
            href={c.href}
            className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 min-h-[120px] group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="relative p-4 flex flex-col justify-end min-h-[120px]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">{c.k}</p>
              <p className="text-lg font-extrabold">{c.t}</p>
            </div>
          </Link>
        ))}
      </div>

      <RecentRail />

      {trending.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Sedang ramai</h2>
              <p className="text-mut text-sm mt-1">Trending Indonesia</p>
            </div>
            <Link href="/trending" className="text-xs text-mut hover:text-white underline underline-offset-4">
              Lihat semua
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {trending.map((t, i) => (
              <SongPlayCard key={`${t.id}-${i}`} tracks={trending} index={i} />
            ))}
          </div>
        </section>
      )}

      {sasak.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Dari Lombok & NTB</h2>
              <p className="text-mut text-sm mt-1">Lagu Sasak dan sekitarnya</p>
            </div>
            <Link
              href="/search?q=lagu%20sasak&type=songs"
              className="text-xs text-mut hover:text-white underline underline-offset-4"
            >
              Cari lagi
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {sasak.map((t, i) => (
              <SongPlayCard key={`${t.id}-${i}`} tracks={sasak} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Rekomendasi untukmu</h2>
            <p className="text-mut text-sm mt-1">Playlist pilihan YouTube Music</p>
          </div>
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

          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {indoArtists.map((a, i) => (
              <Link
                key={`${a.browseId}-${i}`}
                href={`/artist/${a.browseId}`}
                className="group shrink-0 w-24 sm:w-28 flex flex-col items-center text-center"
              >
                <Cover
                  src={pickThumb(a.thumbnails, 200)}
                  title={a.title}
                  size={112}
                  circle
                  sizeClass="w-24 h-24 sm:w-28 sm:h-28"
                  className="ring-2 ring-white/10 group-hover:ring-white/40 transition-all"
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
