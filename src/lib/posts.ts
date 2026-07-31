import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

function parseVerification(value: unknown): "production-tested" | "market-analysis" {
  return value === "production-tested" ? "production-tested" : "market-analysis";
}

function buildOgImageUrl(meta: { title: string; category: string; tags: string[]; affiliatePrograms: string[] }): string {
  const params = new URLSearchParams();
  params.set("title", meta.title);
  if (meta.category) params.set("category", meta.category);
  if (meta.tags?.length) params.set("tags", meta.tags.slice(0, 3).join(","));
  if (meta.affiliatePrograms?.length) params.set("logos", meta.affiliatePrograms.slice(0, 4).join(","));
  return `/api/og?${params.toString()}`;
}

const CATEGORY_FALLBACK: Record<string, string> = { en: "General", ro: "Diverse" };

function getBlogDir(locale: string) {
  return path.join(process.cwd(), "src", "content", "blog", locale);
}

function listSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", ""));
}

function readPostFile(dir: string, slug: string): { data: Record<string, unknown>; content: string } | null {
  const filePath = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return matter(raw);
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  affiliatePrograms: string[];
  readingTime: number;
  image: string;
  verification: "production-tested" | "market-analysis";
}

export interface Post {
  meta: PostMeta;
  content: string;
  wordCount: number;
}

function buildMeta(slug: string, data: Record<string, unknown>, content: string, resolvedLocale: string): PostMeta {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const title = (data.title as string) || slug;
  const category = (data.category as string) || CATEGORY_FALLBACK[resolvedLocale] || CATEGORY_FALLBACK.en;
  const tags = (data.tags as string[]) || [];
  const affiliatePrograms = (data.affiliatePrograms as string[]) || [];
  return {
    slug,
    title,
    description: (data.description as string) || "",
    date: (data.date as string) || "",
    category,
    tags,
    affiliatePrograms,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
    image: buildOgImageUrl({ title, category, tags, affiliatePrograms }),
    verification: parseVerification(data.verification),
  };
}

export function getAllPosts(locale: string = "en"): PostMeta[] {
  const localeSlugs = new Set(listSlugs(getBlogDir(locale)));
  const enSlugs = locale === "en" ? localeSlugs : new Set(listSlugs(getBlogDir("en")));
  const allSlugs = new Set([...localeSlugs, ...enSlugs]);

  const posts: PostMeta[] = [];
  for (const slug of allSlugs) {
    const hasLocaleFile = localeSlugs.has(slug);
    if (!hasLocaleFile && locale !== "en") {
      console.warn(`[posts] "${slug}" has no "${locale}" translation, falling back to "en"`);
    }
    const dir = hasLocaleFile ? getBlogDir(locale) : getBlogDir("en");
    const resolvedLocale = hasLocaleFile ? locale : "en";
    const parsed = readPostFile(dir, slug);
    if (!parsed) continue;
    posts.push(buildMeta(slug, parsed.data, parsed.content, resolvedLocale));
  }
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPost(slug: string, locale: string = "en"): Promise<Post | null> {
  let parsed = readPostFile(getBlogDir(locale), slug);
  let resolvedLocale = locale;
  if (!parsed && locale !== "en") {
    console.warn(`[posts] "${slug}" has no "${locale}" translation, falling back to "en"`);
    parsed = readPostFile(getBlogDir("en"), slug);
    resolvedLocale = "en";
  }
  if (!parsed) return null;
  const { data, content } = parsed;
  const result = await remark().use(html).process(content);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Add IDs to h2/h3 for TOC anchor links
  let htmlContent = result.toString();
  htmlContent = htmlContent.replace(
    /<h([23])([^>]*)>(.*?)<\/h\1>/g,
    (_, level, attrs, text) => {
      const id = text
        .replace(/<[^>]+>/g, "")
        .toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return `<h${level}${attrs} id="${id}" class="scroll-mt-24">${text}</h${level}>`;
    }
  );

  return {
    meta: buildMeta(slug, data, content, resolvedLocale),
    content: htmlContent,
    wordCount,
  };
}

export function getCategories(locale?: string): string[] {
  const posts = getAllPosts(locale);
  return [...new Set(posts.map((p) => p.category))].sort();
}
