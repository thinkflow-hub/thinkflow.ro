"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

interface Channel {
  id: string;
  name: string;
  keywords: string[];
  categories: string[];
  notify: boolean;
  createdAt: string;
}

const STORAGE_KEY = "thinkflow_news_channels";

export function getChannels(): Channel[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveChannel(channel: Channel) {
  const channels = getChannels();
  const idx = channels.findIndex((c) => c.id === channel.id);
  if (idx >= 0) channels[idx] = channel;
  else channels.push(channel);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
}

export function deleteChannel(id: string) {
  const channels = getChannels().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
}

export function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [categories, setCategories] = useState("");
  const router = useRouter();

  useEffect(() => {
    setChannels(getChannels());
  }, []);

  function refresh() {
    setChannels(getChannels());
  }

  function handleCreate() {
    if (!name.trim()) return;
    const channel: Channel = {
      id: `ch_${Date.now()}`,
      name: name.trim(),
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      categories: categories.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean),
      notify: false,
      createdAt: new Date().toISOString(),
    };
    saveChannel(channel);
    refresh();
    setName("");
    setKeywords("");
    setCategories("");
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Channels</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Cancel" : "+ New Channel"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <input
            type="text"
            placeholder="Channel name (e.g. Kubernetes)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Keywords (comma-separated: kubernetes, k8s, docker)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Categories (optional: trending, research, open_source)"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Create Channel
          </button>
        </div>
      )}

      {channels.length === 0 && !showForm && (
        <p className="text-sm text-muted py-8 text-center">
          No custom channels yet. Create one to track specific topics.
        </p>
      )}

      <div className="space-y-2">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center justify-between rounded-lg border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <button
                onClick={() => router.push(`/news/channels/${ch.id}`)}
                className="text-sm font-medium hover:text-primary transition-colors text-left"
              >
                {ch.name}
              </button>
              {ch.keywords.length > 0 && (
                <p className="text-xs text-muted truncate mt-0.5">
                  Keywords: {ch.keywords.join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={() => { deleteChannel(ch.id); refresh(); }}
              className="shrink-0 text-xs text-red-400 hover:text-red-500 ml-3"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
