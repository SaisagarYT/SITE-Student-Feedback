import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // required for Firebase static hosting

  images: {
    unoptimized: true,   // required when using static export
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;