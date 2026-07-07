import type { Metadata } from "next";
import { getAllPosts, getCategories } from "@/lib/posts";
import BlogContent from "@/components/BlogContent";

export const metadata: Metadata = {
  title: "Blog",
  description: "Technical articles on AI infrastructure, web development, and cloud hosting — GEO-optimized with original benchmarks.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getCategories();

  return <BlogContent posts={posts} categories={categories} />;
}
