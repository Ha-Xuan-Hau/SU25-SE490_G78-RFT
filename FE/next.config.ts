import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Explicitly tell Next.js where your pages are located
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

export default nextConfig;
