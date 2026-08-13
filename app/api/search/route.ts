import { search } from "@/lib/scraper/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPES = ["songs", "videos", "albums", "playlists", "artists"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const rawType = url.searchParams.get("type") ?? "songs";
  const type = TYPES.includes(rawType) ? rawType : "songs";

  if (!q) {
    return Response.json({ results: [], error: null });
  }

  try {
    const results = await search(type as any, q);
    return Response.json(
      { results, error: null },
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=300" } }
    );
  } catch (e: any) {
    return Response.json(
      { results: [], error: e?.message || "Pencarian gagal" },
      { status: 500 }
    );
  }
}
