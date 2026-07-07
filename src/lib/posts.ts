import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

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

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((f) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf-8");
      const { data, content } = matter(raw);
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      return {
        slug: f.replace(".md", ""),
        title: data.title || f.replace(".md", ""),
        description: data.description || "",
        date: data.date || "",
        category: data.category || "General",
        tags: data.tags || [],
        affiliatePrograms: data.affiliatePrograms || [],
        readingTime: Math.max(1, Math.ceil(wordCount / 200)),
        image: data.image || "",
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
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

  return {
    meta: {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date || "",
      category: data.category || "General",
      tags: data.tags || [],
      affiliatePrograms: data.affiliatePrograms || [],
      readingTime: Math.max(1, Math.ceil(wordCount / 200)),
      image: data.image || "",
    },
    content: htmlContent,
    wordCount,
  };
}

export function getCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.category))].sort();
}
