"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadSearchHistory } from "@/lib/searchHistory";

export default function RecentRail() {
  const [hist, setHist] = useState<string[]>([]);
  useEffect(() => {
    setHist(loadSearchHistory());
  }, []);
  if (!hist.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold tracking-tight mb-3">Baru dicari</h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {hist.slice(0, 10).map((q) => (
          <Link
            key={q}
            href={`/search?q=${encodeURIComponent(q)}&type=songs`}
            className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/[0.06] ring-1 ring-white/10 text-sm text-soft"
          >
            {q}
          </Link>
        ))}
      </div>
    </section>
  );
}
