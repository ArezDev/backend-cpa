import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Peringatan: Ini akan mengabaikan error linting saat build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Peringatan: Ini akan mengabaikan error type saat build
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["100.79.155.45"],
};

export default nextConfig;