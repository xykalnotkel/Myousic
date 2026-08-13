import { getLyrics } from "@/lib/scraper/lyrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const lyrics = await getLyrics(videoId);
  return Response.json(
    lyrics
      ? { lines: lyrics.lines, source: lyrics.source }
      : { lines: null, source: null },
    { headers: { "Cache-Control": "public, max-age=21600" } }
  );
}
