import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative py-24 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/vinyl-wave.webp"
        alt=""
        aria-hidden
        className="w-52 mx-auto mb-8 opacity-90"
      />
      <h1 className="text-5xl font-extrabold tracking-tighter">404</h1>
      <p className="text-mut mt-3 text-sm mb-8">Lagu yang kamu cari tidak ditemukan di piringan ini.</p>
      <Link
        href="/"
        className="bg-white text-black font-semibold px-6 py-2.5 rounded-full hover:scale-105 transition-transform inline-block"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
