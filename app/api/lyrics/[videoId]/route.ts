import { getLyrics } from "@/lib/scraper/lyrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const url = new URL(req.url);
  const title = url.searchParams.get("title") || undefined;
  const artist = url.searchParams.get("artist") || undefined;
  const lyrics = await getLyrics(videoId, title, artist);
  return Response.json(
    lyrics
      ? { lines: lyrics.lines, source: lyrics.source }
      : { lines: null, source: null },
    { headers: { "Cache-Control": "public, max-age=7200" } }
  );
}
