import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlbum } from "@/lib/scraper/musiclists";
import TrackList from "@/components/TrackList";
import { Cover } from "@/components/ui";
import { bestThumb } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let album: Awaited<ReturnType<typeof getAlbum>>;
  try {
    album = await getAlbum(id);
  } catch (e) {
    console.error("album gagal:", e);
    notFound();
  }
  if (!album?.title) notFound();

  const art = bestThumb(album.thumbnails) ?? bestThumb(album.tracks?.[0]?.thumbnails);

  return (
    <div>
      {/* header dengan blur art */}
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-line mb-8">
        {art && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${art})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(70px) saturate(0.15) brightness(0.4)",
              transform: "scale(1.5)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#050505]/40 to-[#050505]" />
        <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <Cover
            src={art}
            title={album.title}
            size={208}
            className="w-[180px] h-[180px] md:w-[208px] md:h-[208px] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            rounded="rounded-2xl"
          />
          <div className="text-center md:text-left">
            <p className="text-[11px] uppercase tracking-[0.35em] text-soft mb-2">Album</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-glow">
              {album.title}
            </h1>
            <p className="text-mut mt-3 text-sm">
              {album.artist ? (
                <Link href={`/search?q=${encodeURIComponent(album.artist)}&type=artists`} className="hover:underline underline-offset-4">
                  {album.artist}
                </Link>
              ) : (
                "Artis tidak diketahui"
              )}
              {album.year ? ` · ${album.year}` : ""} · {album.tracks?.length ?? 0} lagu
            </p>
          </div>
        </div>
      </div>

      <TrackList tracks={album.tracks ?? []} />
    </div>
  );
}
