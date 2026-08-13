"use client";

export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <div className="py-24 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/cassette-garden.webp"
        alt=""
        aria-hidden
        className="w-52 mx-auto mb-8 opacity-90"
      />
      <h2 className="text-xl font-bold mb-2">Kasetnya macet</h2>
      <p className="text-mut text-sm mb-6">
        Halaman tidak bisa dimuat. Mungkin YouTube sedang membatasi atau layanan sibuk.
      </p>
      <button
        onClick={reset}
        className="bg-white text-black font-semibold px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
      >
        Putar ulang
      </button>
    </div>
  );
}
