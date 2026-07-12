"use client";

import { useMemo, useState } from "react";
import { NewsCard } from "./NewsCard";
import type { NewsItem } from "@/lib/news-types";

interface Props {
  items: NewsItem[];
  dates: string[];
}

const CATEGORIES = [
  "all", "trending", "community", "open_source", "releases",
  "ai_labs", "research", "newsletters", "industry",
] as const;

export function NewsFeed({ items, dates }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const filtered = useMemo(() => {
    let result = items;
    if (activeCategory !== "all") {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [items, activeCategory, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted hover:bg-muted/80"
              }`}
            >
              {cat === "all" ? "All" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search news..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted">No news items match your filters.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <NewsCard key={item.source_id} item={item} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + 12)}
                className="rounded-lg bg-muted px-6 py-2 text-sm font-medium hover:bg-muted/80"
              >
                Load More ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-muted">
        {filtered.length} of {items.length} items shown. Sources: {dates.length} days indexed.
      </p>
    </div>
  );
}
