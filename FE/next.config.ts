import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/dcakldjvc/**",
      },
    ],
    domains: ["res.cloudinary.com"],
  },
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
