// Ambil URL stream audio dari YouTube via InnerTube.
//
// Kenapa sering gagal di Vercel:
// - Lagu YouTube Music biasanya TIDAK punya format progressive (itag 18).
// - Client ANDROID/WEB dari IP datacenter sering mengembalikan format tanpa `url`
//   (butuh PO token / signature), atau playability LOGIN_REQUIRED.
// - Field yang benar adalah `adaptiveFormats` (camelCase), bukan `adaptive_formats`.
// - Client IOS masih mengembalikan adaptive audio (itag 140 m4a) beserta URL langsung.
//
// Format yang diutamakan: audio/mp4 (itag 140) — cocok untuk <audio>, jauh lebih
// kecil dari progressive mp4+video, dan tidak memicu "no supported source".

export interface StreamSource {
  url: string;
  mime: string;
  length?: number;
  itag?: number;
  client: string;
  ua: string;
}

type YtClient = {
  name: string;
  clientName: string;
  clientVersion: string;
  ua: string;
  origin: string;
  endpoint: string;
  extra?: Record<string, unknown>;
  cname?: number;
};

const CLIENTS: YtClient[] = [
  {
    name: "IOS",
    clientName: "IOS",
    clientVersion: "20.11.6",
    ua: "com.google.ios.youtube/20.11.6 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
    origin: "https://www.youtube.com",
    endpoint: "https://www.youtube.com/youtubei/v1/player",
    extra: {
      deviceMake: "Apple",
      deviceModel: "iPhone16,2",
      osName: "iPhone",
      osVersion: "18.3.2.22D82",
      platform: "MOBILE",
    },
    cname: 5,
  },
  {
    name: "ANDROID",
    clientName: "ANDROID",
    clientVersion: "21.20.36",
    ua: "com.google.android.youtube/21.20.36 (Linux; U; Android 14; en_US; sdk_gphone64_x86_64; GoogleTV; 1080p)",
    origin: "https://www.youtube.com",
    endpoint: "https://www.youtube.com/youtubei/v1/player",
    extra: { androidSdkVersion: 34, osName: "Android", osVersion: "14" },
    cname: 3,
  },
  {
    name: "ANDROID_MUSIC",
    clientName: "ANDROID_MUSIC",
    clientVersion: "7.27.52",
    ua: "com.google.android.apps.youtube.music/7.27.52 (Linux; U; Android 14; en_US; Pixel 8)",
    origin: "https://music.youtube.com",
    endpoint: "https://music.youtube.com/youtubei/v1/player",
    extra: { androidSdkVersion: 34, osName: "Android", osVersion: "14" },
    cname: 21,
  },
  {
    name: "WEB_REMIX",
    clientName: "WEB_REMIX",
    clientVersion: "1.20260810.01.02",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    origin: "https://music.youtube.com",
    endpoint: "https://music.youtube.com/youtubei/v1/player",
    cname: 67,
  },
  {
    name: "WEB_EMBEDDED",
    clientName: "WEB_EMBEDDED_PLAYER",
    clientVersion: "1.20260811.01.00",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    origin: "https://www.youtube.com",
    endpoint: "https://www.youtube.com/youtubei/v1/player",
    extra: { clientScreen: "EMBED" },
    cname: 56,
  },
];

type CacheEntry = StreamSource & { expires: number };
const cache = new Map<string, CacheEntry>();

function cleanMime(mime?: string): string {
  if (!mime) return "audio/mp4";
  return mime.split(";")[0].trim();
}

function collectFormats(d: any): any[] {
  const sd = d?.streamingData ?? {};
  return [
    ...(sd.adaptiveFormats ?? []),
    ...(sd.adaptive_formats ?? []),
    ...(sd.formats ?? []),
  ];
}

function pickFormat(fmts: any[]): any | null {
  const withUrl = fmts.filter((f) => f?.url || f?.baseUrl);
  if (!withUrl.length) return null;

  const score = (f: any) => {
    const mime = String(f.mimeType || "");
    const itag = Number(f.itag) || 0;
    // audio/mp4 AAC — paling aman untuk <audio> di Chrome/Firefox/Safari
    if (itag === 140) return 500 + (f.bitrate || 0) / 1e6;
    if (mime.startsWith("audio/mp4")) return 400 + (f.bitrate || 0) / 1e6;
    // opus/webm: bagus di Chrome, gagal di Safari
    if (itag === 251) return 300;
    if (mime.startsWith("audio/webm") || mime.startsWith("audio/")) return 250 + (f.bitrate || 0) / 1e6;
    // progressive mp4 (video+audio) — jalan, tapi MIME video/mp4 kadang ditolak <audio>
    if (itag === 18 || mime.includes("mp4a")) return 150;
    return 1;
  };

  return withUrl.slice().sort((a, b) => score(b) - score(a))[0];
}

async function tryClient(
  videoId: string,
  client: YtClient
): Promise<{ src: StreamSource } | { reason: string }> {
  const body: Record<string, unknown> = {
    context: {
      client: {
        clientName: client.clientName,
        clientVersion: client.clientVersion,
        hl: "en",
        gl: "US",
        utcOffsetMinutes: 0,
        ...client.extra,
      },
    },
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  };

  if (client.name === "WEB_EMBEDDED") {
    (body.context as any).thirdParty = { embedUrl: "https://www.youtube.com" };
  }

  const headers: Record<string, string> = {
    "User-Agent": client.ua,
    Origin: client.origin,
    Referer: client.origin + "/",
    "Content-Type": "application/json",
    "X-Goog-Api-Format-Version": "2",
  };
  if (client.cname) headers["X-YouTube-Client-Name"] = String(client.cname);
  headers["X-YouTube-Client-Version"] = client.clientVersion;

  const res = await fetch(`${client.endpoint}?prettyPrint=false`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });

  if (!res.ok) return { reason: `${client.name} HTTP ${res.status}` };

  const d = await res.json();
  const status = d.playabilityStatus?.status as string | undefined;
  const why = d.playabilityStatus?.reason as string | undefined;
  if (status && status !== "OK") {
    return { reason: `${client.name} ${status}${why ? `: ${why}` : ""}` };
  }

  const fmts = collectFormats(d);
  const fmt = pickFormat(fmts);
  if (!fmt) {
    const n = fmts.length;
    const nUrl = fmts.filter((f: any) => f?.url || f?.baseUrl).length;
    return { reason: `${client.name} no-url (fmt=${n} url=${nUrl})` };
  }

  const url = String(fmt.url || fmt.baseUrl);
  const mime = cleanMime(fmt.mimeType);
  // audio-only → paksa audio/* supaya <audio> tidak menolak video/mp4
  const outMime =
    mime.startsWith("audio/")
      ? mime
      : Number(fmt.itag) === 18
        ? "audio/mp4"
        : mime.startsWith("video/mp4")
          ? "audio/mp4"
          : mime;

  return {
    src: {
      url,
      mime: outMime,
      length: fmt.contentLength ? Number(fmt.contentLength) : undefined,
      itag: fmt.itag ? Number(fmt.itag) : undefined,
      client: client.name,
      ua: client.ua,
    },
  };
}

export function invalidateStream(videoId: string) {
  cache.delete(videoId);
}

export async function getStreamSource(
  videoId: string,
  opts?: { quick?: boolean }
): Promise<StreamSource> {
  const id = videoId.trim();
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
    throw new Error("Video id tidak valid");
  }

  const hit = cache.get(id);
  if (hit && hit.expires > Date.now()) {
    return hit;
  }

  const reasons: string[] = [];

  // ytdl dulu — youtubei.js IOS masih kasih URL audio dari IP datacenter
  try {
    const { getYtdlSource } = await import("./ytdl");
    const src = await getYtdlSource(id);
    const entry: CacheEntry = { ...src, expires: Date.now() + 1000 * 60 * 90 };
    cache.set(id, entry);
    return entry;
  } catch (e: any) {
    reasons.push(e?.message || "ytdl error");
  }

  const list = opts?.quick ? CLIENTS.filter((c) => c.name === "IOS" || c.name === "ANDROID") : CLIENTS;

  for (const client of list) {
    try {
      const out = await tryClient(id, client);
      if ("src" in out) {
        const entry: CacheEntry = {
          ...out.src,
          expires: Date.now() + 1000 * 60 * 90,
        };
        cache.set(id, entry);
        return entry;
      }
      reasons.push(out.reason);
    } catch (e: any) {
      reasons.push(`${client.name} ${e?.message || "error"}`);
    }
  }

  throw new Error(
    `Video tidak dapat diputar. ${reasons.slice(0, 3).join(" · ") || "tidak ada format stream"}`
  );
}

export async function resolveStream(videoId: string, _query?: string | null): Promise<StreamSource> {
  // Jangan ganti video id. Kalau stream id ini gagal, biarkan pemutar yang handle.
  return getStreamSource(videoId);
}
