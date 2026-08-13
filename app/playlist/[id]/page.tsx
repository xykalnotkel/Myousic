import { notFound } from "next/navigation";
import { getPlaylist } from "@/lib/scraper/musiclists";
import TrackList from "@/components/TrackList";
import { Cover } from "@/components/ui";
import { bestThumb } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let playlist: Awaited<ReturnType<typeof getPlaylist>>;
  try {
    playlist = await getPlaylist(id);
  } catch (e) {
    console.error("playlist gagal:", e);
    notFound();
  }
  if (!playlist?.title) notFound();

  const art = bestThumb(playlist.thumbnails) ?? bestThumb(playlist.tracks?.[0]?.thumbnails);
  const totalDur =
    playlist.tracks?.reduce((a: number, t: { duration?: number }) => a + (t.duration ?? 0), 0) ?? 0;

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
            title={playlist.title}
            size={208}
            className="w-[180px] h-[180px] md:w-[208px] md:h-[208px] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            rounded="rounded-2xl"
          />
          <div className="text-center md:text-left">
            <p className="text-[11px] uppercase tracking-[0.35em] text-soft mb-2">Playlist</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-glow">
              {playlist.title}
            </h1>
            <p className="text-mut mt-3 text-sm">
              {playlist.tracks?.length ?? 0} lagu
              {totalDur > 0 && ` · sekitar ${Math.round(totalDur / 60)} menit`}
            </p>
          </div>
        </div>
      </div>

      <TrackList tracks={playlist.tracks ?? []} />
    </div>
  );
}
