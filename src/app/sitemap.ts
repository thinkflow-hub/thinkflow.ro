import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

const staticRoutes = [
  "", "/about", "/contact", "/terms", "/privacy",
  "/affiliate-disclosure", "/media-kit", "/services", "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `https://thinkflow.ro${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://thinkflow.ro/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticEntries, ...blogEntries];
}
