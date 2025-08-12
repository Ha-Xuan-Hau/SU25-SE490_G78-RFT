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
      {
        protocol: "https",
        hostname: "hips.hearstapps.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: [
      "res.cloudinary.com",
      "hips.hearstapps.com",
      "images.unsplash.com",
    ],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint during builds for better code quality
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking during builds
  },
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
  webpack: (config: any) => {
    const fileLoaderRule = config.module?.rules?.find((rule: any) =>
      rule.test?.test?.(".svg")
    );

    if (config.resolve?.alias) {
      config.resolve.alias.canvas = false;
    }

    if (config.module?.rules && fileLoaderRule) {
      config.module.rules.push(
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/, // *.svg?url
        },
        {
          test: /\.svg$/i,
          resourceQuery: { not: /url/ }, // exclude if *.svg?url
          use: ["@svgr/webpack"],
        }
      );

      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;
