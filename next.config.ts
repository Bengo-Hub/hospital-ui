import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.SKIP_STANDALONE !== 'true' && { output: 'standalone' as const }),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "afyaapi.codevertexafrica.com",
      },
      {
        protocol: "https",
        hostname: "sso.codevertexafrica.com",
      },
      {
        protocol: "https",
        hostname: "accounts.codevertexafrica.com",
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
