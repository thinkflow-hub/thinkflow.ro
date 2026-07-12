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
  async rewrites() {
    return [
      {
        source: "/news/archive/:date",
        destination: "/:locale/news/archive/:date",
        locale: false,
      },
      {
        source: "/news/archive",
        destination: "/:locale/news/archive",
        locale: false,
      },
      {
        source: "/news/category/:type",
        destination: "/:locale/news/category/:type",
        locale: false,
      },
      {
        source: "/news/topic/:slug",
        destination: "/:locale/news/topic/:slug",
        locale: false,
      },
      {
        source: "/news/article/:id",
        destination: "/:locale/news/article/:id",
        locale: false,
      },
      {
        source: "/news/graph",
        destination: "/:locale/news/graph",
        locale: false,
      },
      {
        source: "/news/chat",
        destination: "/:locale/news/chat",
        locale: false,
      },
      {
        source: "/news/channels",
        destination: "/:locale/news/channels",
        locale: false,
      },
      {
        source: "/news/channels/:id",
        destination: "/:locale/news/channels/:id",
        locale: false,
      },
      {
        source: "/news/map",
        destination: "/:locale/news/map",
        locale: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
