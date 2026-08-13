import Link from "next/link";
import { search, SearchType } from "@/lib/scraper/search";
import { INDO_ARTISTS } from "@/lib/data";
import { Cover } from "@/components/ui";
import { pickThumb } from "@/lib/thumbs";

export const revalidate = 3600;

export default async function ArtistsPage() {
  const settled = await Promise.allSettled(
    INDO_ARTISTS.map(async (a) => {
      const found = await search(SearchType.ARTISTS, a.query);
      const first = found[0];
      if (!first?.browseId) return null;
      return {
        name: a.name,
        browseId: a.browseId || first.browseId,
        subscribers: first.subscribers,
        thumbnails: first.thumbnails,
      };
    })
  );

  const seen = new Set<string>();
  const artists = settled
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((a): a is NonNullable<typeof a> => !!a?.browseId && !seen.has(a.browseId) && (seen.add(a.browseId), true));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Artis Indonesia</h1>
        <p className="text-mut text-sm mt-1">Geser ke kanan — foto bulat, kurasi Tanah Air.</p>
      </div>

      {artists.length === 0 ? (
        <div className="text-mut text-sm py-16 text-center">Gagal memuat daftar artis. Coba lagi nanti.</div>
      ) : (
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
          {artists.map((a, i) => (
            <Link
              key={`${a.browseId}-${i}`}
              href={`/artist/${a.browseId}`}
              className="group shrink-0 w-28 sm:w-32 flex flex-col items-center text-center"
            >
              <Cover
                src={pickThumb(a.thumbnails, 240)}
                title={a.name}
                size={128}
                circle
                sizeClass="w-28 h-28 sm:w-32 sm:h-32"
                className="ring-2 ring-white/10 group-hover:ring-white/40 group-hover:scale-[1.03] transition-all"
              />
              <p className="mt-3 text-sm font-semibold truncate w-full">{a.name}</p>
              <p className="text-[11px] text-mut truncate w-full">{a.subscribers || "Artis"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
