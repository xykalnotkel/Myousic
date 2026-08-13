import { getStreamSource } from "@/lib/stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // butuh streaming + fetch server

// Proxy stream audio: browser → Next → googlevideo (dengan dukungan Range/seek)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  try {
    const src = await getStreamSource(videoId);

    const range = req.headers.get("range");
    const headers: Record<string, string> = {
      "User-Agent":
        "com.google.android.youtube/21.20.36 (Linux; U; Android 14; en_US; sdk_gphone64_x86_64; GoogleTV; 1080p)",
      ...(range ? { Range: range } : {}),
    };
    const up = await fetch(src.url, { headers, signal: AbortSignal.timeout(30000) });

    const outHeaders = new Headers();
    outHeaders.set("Content-Type", src.mime || up.headers.get("content-type") || "audio/mpeg");
    outHeaders.set("Access-Control-Allow-Origin", "*");
    outHeaders.set("Cache-Control", "no-store");
    if (up.headers.get("content-range")) outHeaders.set("Content-Range", up.headers.get("content-range")!);
    if (up.headers.get("accept-ranges")) outHeaders.set("Accept-Ranges", up.headers.get("accept-ranges")!);
    if (up.headers.get("content-length")) outHeaders.set("Content-Length", up.headers.get("content-length")!);

    if (!up.ok && up.status !== 206) {
      return new Response(`upstream error ${up.status}`, { status: up.status });
    }

    return new Response(up.body, { status: up.status, headers: outHeaders });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "stream failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
