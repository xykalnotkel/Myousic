"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon, I } from "./ui";

export interface Slide {
  href: string;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  image?: string;
}

export default function BannerSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  if (!n) return null;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5600);
    return () => clearInterval(t);
  }, [n]);

  const s = slides[i];

  return (
    <section
      className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black mb-6"
      style={{ minHeight: 200 }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const x = e.changedTouches[0]?.clientX;
        if (start == null || x == null) return;
        const dx = x - start;
        if (dx > 40) setI((v) => (v - 1 + n) % n);
        else if (dx < -40) setI((v) => (v + 1) % n);
      }}
    >
      {slides.map((sl, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-500 ${
            idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {sl.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sl.image} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ maxWidth: "none" }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
        </div>
      ))}

      <div className="relative z-10 px-5 py-8 md:px-12 md:py-14 max-w-xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/55 mb-2">{s.kicker}</p>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">{s.title}</h1>
        <p className="mt-2 text-white/65 text-sm leading-relaxed line-clamp-2">{s.text}</p>
        <Link
          href={s.href}
          className="mt-5 inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-5 py-2.5 rounded-full"
        >
          {s.cta}
          <Icon d={I.next} size={14} />
        </Link>
      </div>

      {n > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1 rounded-full ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/35"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
