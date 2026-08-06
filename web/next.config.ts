import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/tool", destination: "/tool/index.html" },
      { source: "/tool/", destination: "/tool/index.html" },
    ];
  },
};

export default nextConfig;
