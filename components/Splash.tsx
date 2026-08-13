"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { BRAND } from "@/lib/brand";

export default function Splash() {
  const [show, setShow] = useState(true);
  const [out, setOut] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("ms:splashed") === "1") {
        setShow(false);
        return;
      }
      sessionStorage.setItem("ms:splashed", "1");
    } catch {}
    const a = window.setTimeout(() => setOut(true), 1100);
    const b = window.setTimeout(() => setShow(false), 1650);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[80] bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-500 ${
        out ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <Logo size={76} className="text-white rounded-[22px] ring-1 ring-white/15" />
      <p className="mt-5 text-2xl font-extrabold tracking-tight">{BRAND}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.42em] text-mut">Music</p>
    </div>
  );
}
