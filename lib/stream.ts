// Ambil URL stream audio dari YouTube via client ANDROID (tanpa login, tanpa decipher)
// Format yang didapat: itag 18 (progressive mp4 360p + AAC) — browser memutar audionya saja.

const PLAYER_URL =
  "https://www.youtube.com/youtubei/v1/player?alt=json&key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const UA =
  "com.google.android.youtube/21.20.36 (Linux; U; Android 14; en_US; sdk_gphone64_x86_64; GoogleTV; 1080p)";

const cache = new Map<string, { url: string; expires: number }>();

export interface StreamSource {
  url: string;
  mime: string;
  length?: number;
}

export async function getStreamSource(videoId: string): Promise<StreamSource> {
  const hit = cache.get(videoId);
  if (hit && hit.expires > Date.now()) {
    return { url: hit.url, mime: "video/mp4" };
  }

  const res = await fetch(PLAYER_URL, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      Origin: "https://www.youtube.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "21.20.36",
          hl: "en",
          gl: "US",
          androidSdkVersion: 34,
        },
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`player HTTP ${res.status}`);
  const d = await res.json();

  const status = d.playabilityStatus?.status;
  if (status && status !== "OK") {
    throw new Error(d.playabilityStatus?.reason || `unplayable (${status})`);
  }

  const fmts = [
    ...(d.streamingData?.formats ?? []),
    ...(d.streamingData?.adaptive_formats ?? []),
  ];
  // utamakan audio-only, fallback progressive (video+audio)
  const fmt =
    fmts.find((f: any) => f.mimeType?.startsWith("audio") && (f.url || f.baseUrl)) ??
    fmts.find((f: any) => f.url || f.baseUrl);
  if (!fmt) throw new Error("tidak ada format stream");

  const url: string = fmt.url || fmt.baseUrl;
  cache.set(videoId, { url, expires: Date.now() + 1000 * 60 * 60 * 3 });

  return {
    url,
    mime: fmt.mimeType || "video/mp4",
    length: fmt.contentLength ? Number(fmt.contentLength) : undefined,
  };
}
