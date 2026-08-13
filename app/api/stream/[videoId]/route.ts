import { invalidateStream, resolveStream } from "@/lib/stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = ["sin1", "hkg1"];
// Hobby default 10s; audio-only ~2–5 MB biasanya sempat. Naikkan di Pro.
export const maxDuration = 60;

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Accept-Ranges, Content-Type, X-Stream-Client, X-Stream-Itag",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function fetchUpstream(url: string, ua: string, range?: string | null) {
  const headers: Record<string, string> = {
    "User-Agent": ua,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    ...(range ? { Range: range } : {}),
  };
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const up = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(25000),
        redirect: "follow",
        cache: "no-store",
      });
      if (up.ok || up.status === 206) return up;
      lastErr = new Error(`upstream ${up.status}`);
      if ((up.status === 403 || up.status === 429) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return up;
    } catch (e: any) {
      lastErr = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw lastErr ?? new Error("upstream fetch gagal");
}

function jsonError(message: string, status = 502) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const q = url.searchParams.get("q");

  try {
    let src = await resolveStream(videoId, q);

    if (debug) {
      let host = "";
      try {
        host = new URL(src.url).host;
      } catch {}
      return Response.json(
        {
          ok: true,
          client: src.client,
          mime: src.mime,
          itag: src.itag,
          host,
          length: src.length ?? null,
        },
        { headers: { "Cache-Control": "no-store", ...corsHeaders() } }
      );
    }

    const range = req.headers.get("range");

    let up: Response;
    try {
      up = await fetchUpstream(src.url, src.ua, range);
    } catch (e: any) {
      return jsonError(`stream gagal: ${e?.message || "timeout"}`);
    }

    // URL kadaluarsa / IP-bound gagal → buang cache, ambil ulang sekali
    if (up.status === 403 || up.status === 410) {
      invalidateStream(videoId);
      try {
        src = await resolveStream(videoId, q);
        up = await fetchUpstream(src.url, src.ua, range);
      } catch (e: any) {
        return jsonError(`stream gagal setelah retry: ${e?.message || up.status}`);
      }
    }

    if (!up.ok && up.status !== 206) {
      return jsonError(`upstream error ${up.status}`, up.status >= 400 ? up.status : 502);
    }

    const outHeaders = new Headers(corsHeaders());
    outHeaders.set("Content-Type", src.mime || "audio/mp4");
    outHeaders.set("Cache-Control", "no-store");
    outHeaders.set("Accept-Ranges", up.headers.get("accept-ranges") || "bytes");
    outHeaders.set("X-Content-Type-Options", "nosniff");
    outHeaders.set("X-Stream-Client", src.client);
    if (src.itag) outHeaders.set("X-Stream-Itag", String(src.itag));
    const cr = up.headers.get("content-range");
    const cl = up.headers.get("content-length");
    if (cr) outHeaders.set("Content-Range", cr);
    if (cl) outHeaders.set("Content-Length", cl);

    return new Response(up.body, { status: up.status, headers: outHeaders });
  } catch (e: any) {
    return jsonError(e?.message || "stream failed");
  }
}

export async function HEAD(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const src = await resolveStream(videoId, _req.url ? new URL(_req.url).searchParams.get("q") : null);
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": src.mime || "audio/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "X-Stream-Client": src.client,
        ...corsHeaders(),
      },
    });
  } catch (e: any) {
    return jsonError(e?.message || "stream failed");
  }
}
