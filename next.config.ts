import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // youtubei.js (ytdl) jangan di-bundle webpack
  serverExternalPackages: ["youtubei.js"],
  // izinkan preview host e2b saat dev
  allowedDevOrigins: ["*.e2b.app"],
  // YouTube embed butuh Referer yang jelas (lagu berlisensi sering "unavailable" tanpa ini)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "origin-when-cross-origin" }],
      },
    ];
  },
};

export default nextConfig;
