import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts, getPost } from "@/lib/posts";
import { notFound } from "next/navigation";
import ShareButtons from "./ShareButtons";
import ViewTracker from "@/components/ViewTracker";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const ogUrl = `/api/og?title=${encodeURIComponent(post.meta.title)}&category=${encodeURIComponent(post.meta.category)}&tags=${encodeURIComponent(post.meta.tags.join(","))}`;

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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

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
        All Articles
      </Link>

      <div className="flex gap-8">
        {/* ─── Sidebar TOC ─── */}
        {headings.length > 0 && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <h4 className="mb-3 text-xs font-semibold tracking-wider uppercase text-muted">On this page</h4>
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

        {/* ─── Article ─── */}
        <article className="min-w-0 flex-1 max-w-3xl">
          <header className="mb-8">
            <time className="text-sm text-muted">{post.meta.date}</time>
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

          {/* ─── Affiliate Disclosure ─── */}
          <div className="mt-8 rounded-lg border border-border bg-card/60 p-4 text-sm text-muted backdrop-blur-sm">
            <p className="font-semibold text-foreground">Affiliate Disclosure</p>
            <p className="mt-1">
              Some links in this article are affiliate links. If you make a purchase through them, we may
              earn a commission at no extra cost to you. See our{" "}
              <Link href="/affiliate-disclosure" className="underline">full disclosure</Link>.
            </p>
          </div>

          {/* ─── Share ─── */}
          <ShareButtons slug={slug} title={post.meta.title} />

          {/* ─── Author Bio ─── */}
          <div className="mt-8 flex items-start gap-4 rounded-lg border border-border bg-card/60 p-6 backdrop-blur-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">
              DB
            </div>
            <div>
              <p className="font-semibold">Daniel Burcea</p>
              <p className="mt-1 text-sm text-muted">
                AI Systems Architect. Building private AI infrastructure since 2025.
                <Link href="/about" className="ml-1 text-accent underline">Read more &rarr;</Link>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
