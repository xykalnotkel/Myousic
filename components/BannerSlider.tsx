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
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;
  if (!n) return null;

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5600);
    return () => clearInterval(t);
  }, [paused, n]);

  const s = slides[i];

  return (
    <section
      className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 bg-black mb-8 min-h-[280px] md:min-h-[420px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const x = e.changedTouches[0]?.clientX;
        if (start == null || x == null) return;
        const dx = x - start;
        if (dx > 50) setI((v) => (v - 1 + n) % n);
        else if (dx < -50) setI((v) => (v + 1) % n);
      }}
    >
      {slides.map((sl, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={idx !== i}
        >
          {sl.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sl.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>
      ))}

      <div className="relative z-10 px-6 py-10 md:px-14 md:py-16 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/60 mb-4">{s.kicker}</p>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.08] text-glow">
          {s.title}
        </h1>
        <p className="mt-4 text-white/70 max-w-md text-[15px] leading-relaxed">{s.text}</p>
        <Link
          href={s.href}
          className="mt-7 inline-flex items-center gap-3 bg-white text-black font-bold px-6 py-3 rounded-full active:scale-[0.98] transition-transform"
        >
          {s.cta}
          <Icon d={I.next} size={16} />
        </Link>
      </div>

      {n > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-7 bg-white" : "w-1.5 bg-white/35"}`}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
