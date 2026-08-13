// Pilih & perkecil URL thumbnail YouTube/Google supaya load cepat.

export function pickThumb(thumbs?: string[], min = 120): string | undefined {
  if (!thumbs?.length) return undefined;
  // array biasanya kecil → besar
  const sized = thumbs.filter(Boolean);
  if (!sized.length) return undefined;
  if (min <= 80) return sized[0];
  if (min <= 200) return sized[Math.min(1, sized.length - 1)] ?? sized[0];
  return sized[sized.length - 1];
}

/** Paksa ukuran di URL googleusercontent / ytimg. */
export function sizedThumb(url?: string, px = 240): string | undefined {
  if (!url) return undefined;
  try {
    let u = url;
    u = u.replace(/w\d+-h\d+/g, `w${px}-h${px}`);
    u = u.replace(/=s\d+/g, `=s${px}`);
    u = u.replace(/\/s\d+-/g, `/s${px}-`);
    // i.ytimg.com/vi/ID/hqdefault → mqdefault untuk kartu kecil
    if (px <= 160 && /i\.ytimg\.com/.test(u)) {
      u = u.replace(/\/(maxres|sd|hq)default/i, "/mqdefault");
    }
    return u;
  } catch {
    return url;
  }
}
