import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllPosts, getPost } from "@/lib/posts";
import { routing } from "@/i18n/routing";
import ShareButtons from "./ShareButtons";
import ViewTracker from "@/components/ViewTracker";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  const slugs = new Set<string>();
  for (const locale of routing.locales) {
    for (const p of getAllPosts(locale)) slugs.add(p.slug);
  }
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const post = await getPost(slug, locale);
  if (!post) return { title: t("blog.postNotFound") };

  const ogUrl = post.meta.image;

  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.date,
      tags: post.meta.tags,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description,
      images: [ogUrl],
    },
  };
}

function extractHeadings(html: string): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, "");
    const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");
    headings.push({ level: parseInt(match[1]), text, id });
  }
  return headings;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale });
  const post = await getPost(slug, locale);

  if (!post) notFound();

  const headings = extractHeadings(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta.title,
    description: post.meta.description,
    datePublished: post.meta.date,
    author: { "@type": "Person", name: "Daniel Burcea", url: "https://thinkflow.ro/about" },
    publisher: { "@type": "Organization", name: "ThinkFLOW", url: "https://thinkflow.ro" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://thinkflow.ro/blog/${slug}` },
    wordCount: post.wordCount,
    keywords: post.meta.tags.join(", "),
    ...(post.meta.image ? { image: `https://thinkflow.ro${post.meta.image}` } : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <ViewTracker slug={slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="mb-8 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        {t("blog.backToAll")}
      </Link>

      <div className="flex gap-8">
        {headings.length > 0 && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <h4 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted">{t("blog.onThisPage")}</h4>
              <nav className="space-y-1.5">
                {headings.map((h) => (
                  <a
                    key={h.text}
                    href={`#${h.id}`}
                    className={`toc-link block ${h.level === 3 ? "pl-4" : ""}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        <article className="min-w-0 flex-1 max-w-3xl">
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <time className="text-sm text-muted">{post.meta.date}</time>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                  post.meta.verification === "production-tested"
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-border bg-white/5 text-muted"
                }`}
                title={
                  post.meta.verification === "production-tested"
                    ? t("blog.verificationBadge.verifiedTooltip")
                    : t("blog.verificationBadge.marketAnalysisTooltip")
                }
              >
                {post.meta.verification === "production-tested" ? t("blog.verificationBadge.verifiedLabel") : t("blog.verificationBadge.marketAnalysisLabel")}
              </span>
            </div>
            <h1 className="mb-3 mt-1 text-3xl font-bold">{post.meta.title}</h1>
            <p className="text-lg text-muted">{post.meta.description}</p>
            {post.meta.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.meta.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.meta.image && (
            <div className="relative mb-8 overflow-hidden rounded-xl border border-border">
              <Image
                src={post.meta.image}
                alt={post.meta.title}
                width={1200}
                height={630}
                className="w-full object-cover"
                priority
              />
            </div>
          )}

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-8 rounded-lg border border-border bg-card/60 p-4 text-sm text-muted backdrop-blur-sm">
            <p className="font-semibold text-foreground">{t("affiliate.title")}</p>
            <p className="mt-1">
              {t("blog.affiliateNotice")}{" "}
              <Link href="/affiliate-disclosure" className="underline">{t("blog.affiliateLink")}</Link>.
            </p>
          </div>

          <ShareButtons slug={slug} title={post.meta.title} />

          <div className="mt-8 flex items-start gap-4 rounded-lg border border-border bg-card/60 p-6 backdrop-blur-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">
              DB
            </div>
            <div>
              <p className="font-semibold">Daniel Burcea</p>
              <p className="mt-1 text-sm text-muted">
                {t("blog.authorBio")}
                <Link href="/about" className="ml-1 text-accent underline">{t("blog.readAboutAuthor")} &rarr;</Link>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
