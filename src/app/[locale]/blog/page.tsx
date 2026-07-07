import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAllPosts, getCategories } from "@/lib/posts";
import BlogContent from "@/components/BlogContent";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("blog.title"),
    description: t("blog.description"),
  };
}

export default async function BlogPage() {
  const locale = await getLocale();
  const posts = getAllPosts(locale);
  const categories = getCategories(locale);

  return <BlogContent posts={posts} categories={categories} />;
}
