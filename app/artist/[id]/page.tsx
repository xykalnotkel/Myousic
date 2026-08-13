import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtist } from "@/lib/scraper/musiclists";
import TrackList from "@/components/TrackList";
import { Cover } from "@/components/ui";
import { bestThumb } from "@/lib/types";
import type { Track } from "@/lib/types";

export const revalidate = 3600;

interface ArtistAlbum {
  browseId?: string;
  title?: string;
  year?: string;
  thumbnails?: string[];
  kind?: string;
}
interface ArtistData {
  title: string;
  subscribers?: string;
  thumbnails?: string[];
  topTracks?: Track[];
  albums?: ArtistAlbum[];
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let artist: ArtistData | null;
  try {
    artist = (await getArtist(id)) as ArtistData | null;
  } catch (e) {
    console.error("artist gagal:", e);
    notFound();
  }
  if (!artist?.title) notFound();

  const art = bestThumb(artist.thumbnails) ?? bestThumb(artist.topTracks?.[0]?.thumbnails);
  const albums = artist.albums ?? [];
  const singles = albums.filter((a) => a.kind === "single");
  const fullAlbums = albums.filter((a) => a.kind !== "single");

  return (
    <div>
      {/* header */}
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-line mb-8">
        {art && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${art})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(70px) saturate(0.12) brightness(0.4)",
              transform: "scale(1.5)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#050505]/40 to-[#050505]" />
        <div className="relative p-6 md:p-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <Cover src={art} title={artist.title} size={160} circle className="ring-4 ring-white/10 shadow-2xl" />
          <div className="text-center sm:text-left">
          <p className="text-[11px] uppercase tracking-[0.35em] text-soft mb-3">Artis</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-glow">
            {artist.title}
          </h1>
          {artist.subscribers && (
            <p className="text-mut mt-3 text-sm">
              {artist.subscribers} subscriber
              {artist.topTracks?.length ? ` · ${artist.topTracks.length} lagu terpopuler` : ""}
            </p>
          )}
          </div>
        </div>
      </div>

      {/* lagu populer */}
      {artist.topTracks?.length ? (
        <section className="mb-10">
          <h2 className="text-xl font-extrabold tracking-tight mb-4">Lagu Populer</h2>
          <TrackList tracks={artist.topTracks} />
        </section>
      ) : null}

      {/* album */}
      {fullAlbums.length ? (
        <section className="mb-10">
          <h2 className="text-xl font-extrabold tracking-tight mb-4">Album</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {fullAlbums.map((a, i) => (
              <Link
                key={`${a.browseId}-${i}`}
                href={`/album/${a.browseId}`}
                className="card-lift rounded-xl bg-panel ring-1 ring-line p-3"
              >
                <Cover
                  src={bestThumb(a.thumbnails)}
                  title={a.title}
                  sizeClass="w-full aspect-square rounded-lg"
                />
                <p className="mt-3 text-sm font-semibold truncate">{a.title}</p>
                <p className="text-xs text-mut mt-0.5 truncate">{a.year || "Album"}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* single */}
      {singles.length ? (
        <section>
          <h2 className="text-xl font-extrabold tracking-tight mb-4">Single & EP</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {singles.map((a, i) => (
              <Link
                key={`${a.browseId}-${i}`}
                href={`/album/${a.browseId}`}
                className="card-lift rounded-xl bg-panel ring-1 ring-line p-3"
              >
                <Cover
                  src={bestThumb(a.thumbnails)}
                  title={a.title}
                  sizeClass="w-full aspect-square rounded-lg"
                />
                <p className="mt-3 text-sm font-semibold truncate">{a.title}</p>
                <p className="text-xs text-mut mt-0.5 truncate">{a.year || "Single"}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
