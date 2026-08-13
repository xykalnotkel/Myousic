import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // izinkan preview host e2b saat dev
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
