// Cari id alternatif: MV resmi / lirik — lagu Topic artis sering tidak bisa di-embed.

export async function findAltIds(title?: string, artist?: string, exclude?: string): Promise<string[]> {
  const base = [title, artist].filter(Boolean).join(" ").trim();
  if (!base) return [];

  const jobs = [
    { q: `${base} official`, type: "videos" },
    { q: `${base} lirik`, type: "videos" },
    { q: base, type: "videos" },
  ];

  const lists = await Promise.all(
    jobs.map(async ({ q, type }) => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`, { cache: "no-store" });
        const d = await r.json();
        return (d.results ?? []) as { id?: string }[];
      } catch {
        return [] as { id?: string }[];
      }
    })
  );

  const ids: string[] = [];
  for (const results of lists) {
    for (const x of results) {
      const id = x.id;
      if (typeof id === "string" && id.length === 11 && id !== exclude && !ids.includes(id)) {
        ids.push(id);
      }
    }
  }
  return ids.slice(0, 6);
}
