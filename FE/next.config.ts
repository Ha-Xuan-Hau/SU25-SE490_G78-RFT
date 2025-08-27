import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TZ: "Asia/Ho_Chi_Minh",
  },
  serverRuntimeConfig: {
    timeZone: "Asia/Ho_Chi_Minh",
  },
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
    // Fix cho rc-util
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   "rc-util/es/React/isFragment": "rc-util/lib/React/isFragment",
    //   "rc-util/es/Dom/canUseDom": "rc-util/lib/Dom/canUseDom",
    // };

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
  transpilePackages: [
    "antd",
    "@ant-design",
    "rc-util",
    "rc-pagination",
    "rc-picker",
    "rc-notification",
    "rc-tooltip",
    "rc-tree",
    "rc-table",
  ],
};

export default nextConfig;
