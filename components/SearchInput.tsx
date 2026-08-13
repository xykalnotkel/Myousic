"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, I } from "./ui";

export default function SearchInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const push = (value: string) => {
    const v = value.trim();
    const p = new URLSearchParams(params.toString());
    if (v) p.set("q", v);
    else p.delete("q");
    router.replace(`/search?${p.toString()}`, { scroll: false });
  };

  const onChange = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(value), 450);
  };

  return (
    <div className="relative max-w-2xl w-full group">
      <Icon
        d={I.search}
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-mut group-focus-within:text-white transition-colors"
      />
      <input
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari lagu, album, playlist, artis…"
        className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] ring-1 ring-transparent focus:ring-white/30 rounded-full pl-12 pr-12 py-3.5 text-[15px] outline-none transition-all placeholder:text-[#6a6a6a]"
        autoFocus
      />
      {q && (
        <button
          onClick={() => {
            setQ("");
            push("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Hapus"
        >
          <Icon d={I.close} size={14} />
        </button>
      )}
    </div>
  );
}
