import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

function buildOgImageUrl(meta: { title: string; category: string; tags: string[]; affiliatePrograms: string[] }): string {
  const params = new URLSearchParams();
  params.set("title", meta.title);
  if (meta.category) params.set("category", meta.category);
  if (meta.tags?.length) params.set("tags", meta.tags.slice(0, 3).join(","));
  if (meta.affiliatePrograms?.length) params.set("logos", meta.affiliatePrograms.slice(0, 4).join(","));
  return `/api/og?${params.toString()}`;
}

function getBlogDir(locale?: string) {
  const base = path.join(process.cwd(), "src", "content", "blog");
  if (!locale) return base;
  const dir = path.join(base, locale);
  if (fs.existsSync(dir)) return dir;
  const enDir = path.join(base, "en");
  return fs.existsSync(enDir) ? enDir : base;
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
}

export interface Post {
  meta: PostMeta;
  content: string;
  wordCount: number;
}

export function getAllPosts(locale?: string): PostMeta[] {
  const dir = getBlogDir(locale);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const { data, content } = matter(raw);
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const slug = f.replace(".md", "");
      const title = data.title || slug;
      const category = data.category || "General";
      const tags = data.tags || [];
      const affiliatePrograms = data.affiliatePrograms || [];
      return {
        slug,
        title,
        description: data.description || "",
        date: data.date || "",
        category,
        tags,
        affiliatePrograms,
        readingTime: Math.max(1, Math.ceil(wordCount / 200)),
        image: buildOgImageUrl({ title, category, tags, affiliatePrograms }),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPost(slug: string, locale?: string): Promise<Post | null> {
  const filePath = path.join(getBlogDir(locale), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
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

  const title = data.title || slug;
  const category = data.category || "General";
  const tags = data.tags || [];
  const affiliatePrograms = data.affiliatePrograms || [];

  return {
    meta: {
      slug,
      title,
      description: data.description || "",
      date: data.date || "",
      category,
      tags,
      affiliatePrograms,
      readingTime: Math.max(1, Math.ceil(wordCount / 200)),
      image: buildOgImageUrl({ title, category, tags, affiliatePrograms }),
    },
    content: htmlContent,
    wordCount,
  };
}

export function getCategories(locale?: string): string[] {
  const posts = getAllPosts(locale);
  return [...new Set(posts.map((p) => p.category))].sort();
}
