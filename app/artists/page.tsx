import Link from "next/link";
import { search, SearchType } from "@/lib/scraper/search";
import { POPULAR_ARTISTS } from "@/lib/data";
import { Cover } from "@/components/ui";
import { bestThumb } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const settled = await Promise.allSettled(
    POPULAR_ARTISTS.map((a) => search(SearchType.ARTISTS, a.name))
  );

  const artists = settled
    .map((r, i) => {
      if (r.status !== "fulfilled") return null;
      const first = r.value[0];
      if (!first?.browseId) return null;
      return {
        name: first.title ?? POPULAR_ARTISTS[i].name,
        origin: POPULAR_ARTISTS[i].origin,
        browseId: first.browseId,
        subscribers: first.subscribers,
        thumbnails: first.thumbnails,
      };
    })
    .filter(Boolean) as {
    name: string;
    origin: string;
    browseId: string;
    subscribers?: string;
    thumbnails?: string[];
  }[];

  const indo = artists.filter((a) => a.origin === "Indonesia");
  const intern = artists.filter((a) => a.origin === "Internasional");

  const Grid = ({ list }: { list: typeof artists }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {list.map((a, i) => (
        <Link
          key={`${a.browseId}-${i}`}
          href={`/artist/${a.browseId}`}
          className="card-lift rounded-2xl bg-panel ring-1 ring-line p-4 flex flex-col items-center text-center"
        >
          <Cover
            src={bestThumb(a.thumbnails)}
            title={a.name}
            sizeClass="w-20 h-20 sm:w-24 sm:h-24 rounded-full"
            className="ring-2 ring-white/10"
          />
          <p className="mt-3 text-sm font-semibold truncate w-full">{a.name}</p>
          <p className="text-[11px] text-mut truncate w-full">{a.subscribers || "Artis"}</p>
        </Link>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Artis</h1>
        <p className="text-mut text-sm mt-1">
          Pilihan artis populer Indonesia &amp; internasional
        </p>
      </div>

      {artists.length === 0 ? (
        <div className="text-mut text-sm py-16 text-center">
          Gagal memuat daftar artis. Coba lagi nanti.
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-xl font-extrabold tracking-tight mb-4">🇮🇩 Indonesia</h2>
            <Grid list={indo} />
          </section>
          <section>
            <h2 className="text-xl font-extrabold tracking-tight mb-4">🌍 Internasional</h2>
            <Grid list={intern} />
          </section>
        </>
      )}
    </div>
  );
}
