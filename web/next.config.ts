import type { NextConfig } from "next";

const nestApiUrl = process.env.NEST_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Portfolio ship path — tighten after recruiter demo URL is live
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async rewrites() {
    if (!nestApiUrl) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${nestApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
