import { getStreamSource } from "@/lib/stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // butuh streaming + fetch server

const UP_UA =
  "com.google.android.youtube/21.20.36 (Linux; U; Android 14; en_US; sdk_gphone64_x86_64; GoogleTV; 1080p)";

async function fetchUpstream(url: string, range?: string | null) {
  const headers: Record<string, string> = {
    "User-Agent": UP_UA,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    ...(range ? { Range: range } : {}),
  };
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const up = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000),
        // redirect manual tidak diperlukan; follow default
      });
      if (up.ok || up.status === 206) return up;
      lastErr = new Error(`upstream ${up.status}`);
      // 403/429: jeda singkat lalu coba lagi
      if ((up.status === 403 || up.status === 429) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
      return up;
    } catch (e: any) {
      lastErr = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr ?? new Error("upstream fetch gagal");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  try {
    const src = await getStreamSource(videoId);
    const range = req.headers.get("range");

    let up: Response;
    try {
      up = await fetchUpstream(src.url, range);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: `stream gagal: ${e?.message || "timeout"}` }),
        { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const outHeaders = new Headers();
    outHeaders.set("Content-Type", src.mime || "audio/mp4");
    outHeaders.set("Access-Control-Allow-Origin", "*");
    outHeaders.set("Cache-Control", "no-store");
    outHeaders.set("Accept-Ranges", up.headers.get("accept-ranges") || "bytes");
    if (up.headers.get("content-range")) outHeaders.set("Content-Range", up.headers.get("content-range")!);
    if (up.headers.get("content-length")) outHeaders.set("Content-Length", up.headers.get("content-length")!);

    if (!up.ok && up.status !== 206) {
      return new Response(JSON.stringify({ error: `upstream error ${up.status}` }), {
        status: up.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(up.body, { status: up.status, headers: outHeaders });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "stream failed" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
