import type { NextConfig } from "next";

/** External Nest only for local dev on port 4000; production uses web/api/nest.ts */
const nestApiUrl = process.env.NEST_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  async rewrites() {
    if (!nestApiUrl || nestApiUrl.includes("localhost:3000")) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${nestApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
