import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllDates } from "@/lib/news";

const staticRoutes = [
  "", "/about", "/contact", "/terms", "/privacy",
  "/affiliate-disclosure", "/media-kit", "/services", "/blog", "/news",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const newsDates = getAllDates();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `https://thinkflow.ro${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? 1.0 : route === "/news" ? "daily" : 0.8,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://thinkflow.ro/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const newsEntries: MetadataRoute.Sitemap = newsDates.map((date) => ({
    url: `https://thinkflow.ro/news/archive/${date}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries, ...newsEntries];
}
