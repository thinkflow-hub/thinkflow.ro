import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findNewsItem, readNewsFile, getAllDates, semanticCluster } from "@/lib/news";
import type { Category } from "@/lib/news-types";
import { CATEGORY_COLORS } from "@/lib/news-types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; source_id: string }> }): Promise<Metadata> {
  const { source_id } = await params;
  const item = findNewsItem(source_id);
  if (!item) return { title: "Article not found" };
  return { title: item.title, description: item.description || item.summary || "" };
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; source_id: string }> }) {
  const { locale, source_id } = await params;
  const item = findNewsItem(source_id);
  if (!item) notFound();

  const catColor = CATEGORY_COLORS[item.category as Category] || "#94a3b8";

  // Find cluster siblings for timeline
  const dates = getAllDates();
  const recentItems = dates.slice(0, 3).flatMap((d) => readNewsFile(d));
  const clustered = semanticCluster(recentItems);
  let timelineItems: typeof recentItems = [];
  for (const [, group] of clustered) {
    if (group.some((i) => i.source_id === source_id) && group.length > 1) {
      timelineItems = group.filter((i) => i.source_id !== source_id);
      break;
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/${locale}/news`} className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors">
        ← Back to News
      </Link>

      <article>
        <div className="mb-4 flex items-center gap-2">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: catColor }}
          >
            {item.category}
          </span>
          <span className="text-xs text-muted">{item.source_name}</span>
          <span className="text-xs text-muted">{item.published?.slice(0, 10)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{item.title}</h1>

        {item.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="mb-6 w-full rounded-xl object-cover max-h-96" loading="lazy" decoding="async" />
        )}

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Read original ↗
        </a>

        {item.sentiment && (
          <p className="mb-4 text-sm">
            Sentiment:{" "}
            <span className={
              item.sentiment === "positive" ? "text-green-500" :
              item.sentiment === "negative" ? "text-red-500" : "text-muted"
            }>
              {item.sentiment}
            </span>
          </p>
        )}

        {/* AI Summaries */}
        <div className="mb-8 space-y-4">
          {item.summary && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">TL;DR</h2>
              <p className="text-sm leading-relaxed">{item.summary}</p>
            </section>
          )}
          {item.summary_detailed && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Detailed Summary</h2>
              <p className="text-sm leading-relaxed">{item.summary_detailed}</p>
            </section>
          )}
          {item.summary_bullets && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Key Points</h2>
              <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
                {item.summary_bullets.split("\n").filter(Boolean).map((point, i) => (
                  <li key={i}>{point.replace(/^[-*]\s*/, "")}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Keywords */}
        {item.keywords && item.keywords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Keywords</h2>
            <div className="flex flex-wrap gap-1.5">
              {item.keywords.map((kw) => (
                <Link
                  key={kw}
                  href={`/${locale}/news/topic/${kw.toLowerCase().replace(/\s+/g, "-")}`}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Source metadata */}
        <div className="mb-8 rounded-xl border bg-card p-4 text-xs text-muted space-y-1">
          {item.source_name && <p>Source: {item.source_name}</p>}
          {item.subreddit && <p>Subreddit: r/{item.subreddit}</p>}
          {item.comments_url && (
            <p>
              <a href={item.comments_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View comments ↗
              </a>
            </p>
          )}
          {item.score > 0 && <p>Score: {item.score}</p>}
          {item.language && <p>Language: {item.language}</p>}
        </div>
      </article>

      {/* Timeline: related articles from same cluster */}
      {timelineItems.length > 0 && (
        <section className="border-t pt-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Also covered by</h2>
          <div className="space-y-2">
            {timelineItems.map((related) => (
              <a
                key={related.source_id}
                href={related.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm transition-colors hover:border-primary/30"
              >
                {related.favicon && (
                  <img src={related.favicon} alt="" className="h-4 w-4 rounded-sm" loading="lazy" decoding="async" />
                )}
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {related.source_name}
                </span>
                <span className="truncate">{related.title}</span>
                <span className="shrink-0 text-xs text-muted">{related.score}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
