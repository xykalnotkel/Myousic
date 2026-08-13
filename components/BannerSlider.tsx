"use client";

import { useEffect, useState } from "react";
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
  const n = slides.length;
  if (!n) return null;

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [paused, n]);

  const s = slides[i];

  return (
    <section
      className="relative overflow-hidden rounded-3xl ring-1 ring-line bg-white/[0.02] mb-12 min-h-[300px] md:min-h-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((sl, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          aria-hidden={idx !== i}
        >
          {sl.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sl.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-35"
              loading={idx === 0 ? "eager" : "lazy"}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/75 to-[#050505]/20" />
          <div
            aria-hidden
            className="absolute -top-40 -right-24 w-[420px] h-[420px] rounded-full bg-white blur-[110px] opacity-[0.07]"
          />
        </div>
      ))}

      <div className="relative z-10 px-8 py-12 md:px-14 md:py-16 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.4em] text-mut mb-4">{s.kicker}</p>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.08] text-glow">
          {s.title}
        </h1>
        <p className="mt-4 text-mut max-w-md text-[15px] leading-relaxed">{s.text}</p>
        <Link
          href={s.href}
          className="mt-7 inline-flex items-center gap-3 bg-white text-black font-bold px-6 py-3 rounded-full hover:scale-[1.03] active:scale-[0.98] transition-transform"
        >
          {s.cta}
          <Icon d={I.next} size={16} />
        </Link>
      </div>

      {n > 1 && (
        <>
          <button
            onClick={() => setI((x) => (x - 1 + n) % n)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-white/15 flex items-center justify-center text-white"
            aria-label="Slide sebelumnya"
          >
            <Icon d={I.chevronL} size={20} />
          </button>
          <button
            onClick={() => setI((x) => (x + 1) % n)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-white/15 flex items-center justify-center text-white"
            aria-label="Slide berikutnya"
          >
            <Icon d={I.chevronR} size={20} />
          </button>
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-7 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
