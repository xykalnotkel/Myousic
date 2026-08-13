// Ambil URL stream audio dari YouTube via beberapa client InnerTube (tanpa login, tanpa decipher).
// Format yang didapat umumnya itag 18 (progressive mp4 360p + AAC) — browser memutar audionya saja.
// Multi-client fallback agar lebih tahan terhadap video yang ditolak satu client tertentu.

const KEY_ANDROID = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const KEY_MUSIC = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30";

const CLIENTS: {
  name: string;
  clientName: string;
  clientVersion: string;
  ua: string;
  origin: string;
  extra?: Record<string, unknown>;
}[] = [
  {
    name: "ANDROID",
    clientName: "ANDROID",
    clientVersion: "21.20.36",
    ua: "com.google.android.youtube/21.20.36 (Linux; U; Android 14; en_US; sdk_gphone64_x86_64; GoogleTV; 1080p)",
    origin: "https://www.youtube.com",
    extra: { androidSdkVersion: 34 },
  },
  {
    name: "ANDROID_MUSIC",
    clientName: "ANDROID_MUSIC",
    clientVersion: "7.01.51",
    ua: "com.google.android.apps.youtube.music/7.01.51 (Linux; U; Android 14; en_US)",
    origin: "https://www.youtube.com",
    extra: { androidSdkVersion: 34 },
  },
  {
    name: "WEB_REMIX",
    clientName: "WEB_REMIX",
    clientVersion: "1.20260810.01.02",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    origin: "https://music.youtube.com",
  },
];

const cache = new Map<string, { url: string; mime: string; expires: number }>();

export interface StreamSource {
  url: string;
  mime: string;
  length?: number;
}

function cleanMime(mime?: string): string {
  if (!mime) return "video/mp4";
  return mime.split(";")[0].trim();
}

async function tryClient(
  videoId: string,
  client: (typeof CLIENTS)[number]
): Promise<{ url: string; mime: string } | null> {
  const key = client.name === "ANDROID" || client.name === "ANDROID_MUSIC" ? KEY_ANDROID : KEY_MUSIC;
  const base =
    client.origin === "https://music.youtube.com"
      ? "https://music.youtube.com/youtubei/v1/player"
      : "https://www.youtube.com/youtubei/v1/player";

  const res = await fetch(`${base}?alt=json&key=${key}`, {
    method: "POST",
    headers: {
      "User-Agent": client.ua,
      Origin: client.origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: client.clientName,
          clientVersion: client.clientVersion,
          hl: "en",
          gl: "US",
          ...client.extra,
        },
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const d = await res.json();

  const status = d.playabilityStatus?.status;
  if (status && status !== "OK") return null;

  const fmts = [
    ...(d.streamingData?.formats ?? []),
    ...(d.streamingData?.adaptive_formats ?? []),
  ];
  // utamakan audio-only, fallback progressive
  const fmt =
    fmts.find((f: any) => f.mimeType?.startsWith("audio") && (f.url || f.baseUrl)) ??
    fmts.find((f: any) => f.url || f.baseUrl);
  if (!fmt) return null;

  return { url: fmt.url || fmt.baseUrl, mime: cleanMime(fmt.mimeType) };
}

export async function getStreamSource(videoId: string): Promise<StreamSource> {
  const hit = cache.get(videoId);
  if (hit && hit.expires > Date.now()) {
    return { url: hit.url, mime: hit.mime };
  }

  let lastError = "tidak ada format stream";
  for (const client of CLIENTS) {
    try {
      const src = await tryClient(videoId, client);
      if (src) {
        cache.set(videoId, { url: src.url, mime: src.mime, expires: Date.now() + 1000 * 60 * 60 * 3 });
        return { url: src.url, mime: src.mime };
      }
    } catch (e: any) {
      lastError = e?.message || lastError;
    }
  }

  throw new Error(
    `Video tidak dapat diputar (${lastError}). Mungkin dibatasi wilayah, usia, atau tidak tersedia.`
  );
}
