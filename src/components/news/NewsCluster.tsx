"use client";

import { useState } from "react";
import type { NewsItem, Category } from "@/lib/news-types";
import { CATEGORY_COLORS } from "@/lib/news-types";

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

export function NewsCluster({ clusterItems }: { clusterItems: NewsItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const main = clusterItems[0];
  const catColor = CATEGORY_COLORS[main.category as Category] || "#94a3b8";
  const sourceList = clusterItems.map((i) => i.source_name).filter(Boolean);
  const uniqueSources = [...new Set(sourceList)];

  return (
    <div className="flex flex-col rounded-xl border bg-card transition-all hover:shadow-md hover:border-primary/30">
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: catColor }}
          >
            {main.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {clusterItems.length} sources
          </span>
          {main.score > 0 && (
            <span className="ml-auto text-[11px] font-medium text-muted">{main.score}</span>
          )}
        </div>

        <h3 className="mb-1.5 text-sm font-semibold leading-snug line-clamp-2">{main.title}</h3>

        {main.summary && (
          <p className="mb-2 text-xs text-muted line-clamp-2">{main.summary}</p>
        )}

        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="text-xs text-primary/80">Covered by {uniqueSources.join(", ")}</span>
        </div>

        {clusterItems.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? "Hide sources ▲" : "Show all sources ▼"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border">
          {clusterItems.map((item) => (
            <a
              key={item.source_id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-muted/50"
            >
              {item.favicon && (
                <img src={item.favicon} alt="" className="h-3.5 w-3.5 rounded-sm shrink-0" />
              )}
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted">
                {item.source_name}
              </span>
              <span className="truncate text-muted group-hover:text-foreground transition-colors">
                {item.title}
              </span>
              <span className="ml-auto shrink-0 text-muted">{extractDomain(item.url)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
