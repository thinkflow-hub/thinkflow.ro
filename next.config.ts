import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  // Rewrites/redirects removed — news pages use next-intl locale prefix.
  // Internal navigation via @/i18n/navigation Link handles locale automatically.
  async redirects() {
    return [
      // news.thinkflow.ro used to be its own Vercel project. The news pipeline
      // was moved into this app (/news) but the subdomain kept serving the old
      // deployment, frozen at 2026-07-07 with 404s on its category routes.
      // Everything on that host now lands on the live /news section instead.
      // next.config redirects run before middleware, so next-intl never sees
      // these requests and cannot prefix them with a locale first.
      {
        source: "/:path*",
        has: [{ type: "host", value: "news.thinkflow.ro" }],
        destination: "https://thinkflow.ro/news",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
