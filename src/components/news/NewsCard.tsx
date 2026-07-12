import type { NewsItem, Category } from "@/lib/news-types";
import { CATEGORY_COLORS, SENTIMENT_COLORS } from "@/lib/news-types";
import { Link } from "@/i18n/navigation";

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

export function NewsCard({ item }: { item: NewsItem }) {
  const catColor = CATEGORY_COLORS[item.category as Category] || "#94a3b8";
  const sentColor = item.sentiment ? SENTIMENT_COLORS[item.sentiment] : null;

  return (
    <div className="group flex flex-col rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: catColor }}
        >
          {item.category}
        </span>
        {sentColor && (
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: sentColor }}
            title={item.sentiment || undefined}
          />
        )}
        {item.score > 0 && (
          <span className="ml-auto text-[11px] font-medium text-muted">{item.score}</span>
        )}
      </div>

      {item.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnail} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" loading="lazy" decoding="async" />
      )}

      <Link href={`/news/article/${item.source_id}`} className="mb-1.5">
        <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h3>
      </Link>

      {item.summary && (
        <p className="mb-2 text-xs text-muted line-clamp-2">{item.summary}</p>
      )}

      <div className="mt-auto flex items-center gap-2 text-[11px] text-muted">
        {item.favicon && (
          <img src={item.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" loading="lazy" decoding="async" />
        )}
        <span className="truncate">{extractDomain(item.url)}</span>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-primary hover:text-primary/80 transition-colors">
          ↗
        </a>
      </div>
    </div>
  );
}
