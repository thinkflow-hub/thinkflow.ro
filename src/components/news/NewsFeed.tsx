"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { NewsCard } from "./NewsCard";
import { NewsCluster } from "./NewsCluster";
import { groupByCluster } from "@/lib/news";
import type { NewsItem } from "@/lib/news-types";

interface Props {
  items: NewsItem[];
  dates: string[];
}

const CATEGORIES = [
  "all", "trending", "community", "open_source", "releases",
  "ai_labs", "research", "newsletters", "industry",
] as const;

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function NewsFeed({ items, dates }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NewsItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 3) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/news/search?q=${encodeURIComponent(searchQuery)}&days=14&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // fallback: keep local results
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const filtered = useMemo(() => {
    let result = items;
    // Use server-side search results when available (3+ chars)
    if (searchResults) {
      result = searchResults;
    }
    if (activeCategory !== "all") {
      result = result.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim() && !searchResults) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [items, activeCategory, searchQuery, searchResults]);

  const grouped = useMemo(() => {
    const dateMap = new Map<string, NewsItem[]>();
    for (const item of filtered) {
      const date = item.published?.slice(0, 10) || "unknown";
      const group = dateMap.get(date);
      if (group) group.push(item);
      else dateMap.set(date, [item]);
    }
    return Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        groups: Array.from(groupByCluster(items).entries()),
      }));
  }, [filtered]);

  let visibleCountRemaining = visibleCount;
  const visibleGroups: { date: string; groups: [string, NewsItem[]][] }[] = [];
  for (const entry of grouped) {
    if (visibleCountRemaining <= 0) break;
    const visibleGroupsForDate: [string, NewsItem[]][] = [];
    for (const [key, gItems] of entry.groups) {
      if (visibleCountRemaining <= 0) break;
      visibleGroupsForDate.push([key, gItems]);
      visibleCountRemaining -= 1; // each cluster/single = 1 visual unit
    }
    if (visibleGroupsForDate.length > 0) {
      visibleGroups.push({ date: entry.date, groups: visibleGroupsForDate });
    }
  }
  const totalVisible = visibleGroups.reduce((sum, d) => sum + d.groups.length, 0);
  const totalVisualUnits = grouped.reduce((sum, d) => sum + d.groups.length, 0);
  const hasMore = totalVisible < totalVisualUnits;

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
        <div className="relative ml-auto">
          <input
            type="text"
            placeholder="Search news across 14 days..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 rounded-lg border bg-background px-3 py-1.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searching && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted animate-pulse">...</span>
          )}
          {searchResults && !searching && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted">{searchResults.length}</span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted">No news items match your filters.</p>
      ) : (
        <>
          <div className="space-y-8">
            {visibleGroups.map(({ date, groups }) => (
              <div key={date}>
                <h2
                  className="sticky top-20 z-10 mb-4 bg-background/80 py-2 text-sm font-semibold text-muted uppercase tracking-wider backdrop-blur-sm"
                >
                  {formatDateLabel(date)}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map(([key, gItems]) =>
                    key.startsWith("cluster_") ? (
                      <NewsCluster key={key} clusterItems={gItems} />
                    ) : (
                      <NewsCard key={gItems[0].source_id} item={gItems[0]} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + 12)}
                className="rounded-lg bg-muted px-6 py-2 text-sm font-medium hover:bg-muted/80"
              >
                Load More ({totalVisualUnits - totalVisible} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {!hasMore && filtered.length > 0 && (
        <p className="mt-12 text-center text-sm text-muted/60">
          🌿 That&apos;s all for now. Come back tomorrow.
        </p>
      )}

      <p className="mt-4 text-xs text-muted">
        {filtered.length} of {items.length} items shown. Sources: {dates.length} days indexed.
      </p>
    </div>
  );
}
