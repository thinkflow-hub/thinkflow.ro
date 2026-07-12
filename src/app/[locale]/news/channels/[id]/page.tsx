"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsItem } from "@/lib/news-types";

// Default channel data for SSR (will be overridden client-side)
interface Channel {
  id: string; name: string; keywords: string[];
  categories: string[]; notify: boolean; createdAt: string;
}

import { getChannels } from "@/components/news/ChannelManager";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/news/search?q=&days=14&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.results || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const channels = getChannels();
  const channel = channels.find((c) => c.id === channelId);

  const filtered = useMemo(() => {
    if (!channel) return [];
    return items.filter((item) => {
      const text = [item.title, item.description, item.summary, ...(item.keywords || [])]
        .filter(Boolean).join(" ").toLowerCase();
      const kwMatch = channel.keywords.length === 0 || channel.keywords.some((k) => text.includes(k.toLowerCase()));
      const catMatch = channel.categories.length === 0 || channel.categories.includes(item.category);
      return kwMatch && catMatch;
    });
  }, [items, channel]);

  if (!channel) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-muted">Channel not found.</p>
        <Link href="/news/channels" className="text-sm text-primary hover:underline mt-2 inline-block">
          ← Back to channels
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/news/channels" className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors">
        ← My Channels
      </Link>

      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{channel.name}</h1>
        {channel.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {channel.keywords.map((kw) => (
              <span key={kw} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted">{kw}</span>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <p className="text-sm text-muted animate-pulse">Loading articles...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted py-8">No articles match this channel&apos;s keywords yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <NewsCard key={item.source_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
