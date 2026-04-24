import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
  serverExternalPackages: [],
  experimental: {
    proxyTimeout: 120_000, // 120 seconds for AI generation
  },
};

export default nextConfig;
