"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { source_id: string; title: string; url: string }[];
}

export function NewsChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/news/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.answer || data.error || "No response",
        sources: data.sources || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Network error. Try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col glass-card relative noise-overlay">
      <div className="flex items-center justify-between border-b border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">Ask the News</h3>
        {onClose && (
          <button onClick={onClose} className="text-xs text-muted hover:text-foreground">Close ✕</button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted py-8">
            Ask anything about the news archive.<br />
            Try: "What happened in AI this week?" or "Summarize security stories"
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === "user"
                  ? "glass-button text-white"
                  : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {msg.sources.slice(0, 3).map((s) => (
                    <Link
                      key={s.source_id}
                      href={`/news/article/${s.source_id}`}
                      className="block text-[10px] text-accent/80 hover:text-accent hover:underline"
                    >
                      📄 {s.title.slice(0, 60)}
                    </Link>
                  ))}
                  {msg.sources.length > 3 && (
                    <p className="text-[10px] text-muted">+{msg.sources.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-border bg-white/5 px-3 py-2 text-xs text-muted animate-pulse">
              Searching articles...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about the news..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-accent/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="glass-button rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? "..." : "Ask"}
        </button>
      </form>
    </div>
  );
}
