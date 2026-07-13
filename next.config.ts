import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: "D:\\WebDev\\thinkflow.ro",
  },
  // Rewrites/redirects removed — news pages use next-intl locale prefix.
  // Internal navigation via @/i18n/navigation Link handles locale automatically.
};

export default withNextIntl(nextConfig);
