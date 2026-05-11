import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      // Mock/placeholder images used during Phase A page stubs
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Common asset CDN hosts (extend as providers come online)
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "*.replicate.delivery" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
