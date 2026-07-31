import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllDates } from "@/lib/news";
import { routing } from "@/i18n/routing";

const staticRoutes = [
  "", "/about", "/contact", "/terms", "/privacy",
  "/affiliate-disclosure", "/media-kit", "/services", "/blog", "/news",
];

// localePrefix "as-needed": the default locale (en) has no prefix, every
// other locale is prefixed — so building URLs must mirror that, not just
// prepend `/${locale}` uniformly.
function localizedPath(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const newsDates = getAllDates();

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `https://thinkflow.ro${localizedPath(locale, route)}`,
      lastModified: new Date(),
      changeFrequency: (route === "" ? "daily" : route === "/news" ? "daily" : "monthly") as
        | "daily"
        | "monthly",
      priority: route === "" ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `https://thinkflow.ro${localizedPath(l, route)}`])
        ),
      },
    }))
  );

  const blogEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) => {
    const posts = getAllPosts(locale);
    return posts.map((post) => ({
      url: `https://thinkflow.ro${localizedPath(locale, `/blog/${post.slug}`)}`,
      lastModified: new Date(post.date),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [
            l,
            `https://thinkflow.ro${localizedPath(l, `/blog/${post.slug}`)}`,
          ])
        ),
      },
    }));
  });

  // News content is English-only (no RO translation exists) — indexing it
  // under /ro would serve the same English text under a Romanian path,
  // which is a hreflang/duplicate-content problem, not a fix.
  const newsEntries: MetadataRoute.Sitemap = newsDates.map((date) => ({
    url: `https://thinkflow.ro/news/archive/${date}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries, ...newsEntries];
}
