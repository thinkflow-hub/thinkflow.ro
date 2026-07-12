import type { DailyBriefing } from "@/lib/news-types";

function moodEmoji(mood: string): string {
  const map: Record<string, string> = {
    bullish: "📈",
    cautious: "⚠️",
    neutral: "📊",
    positive: "🌟",
    negative: "🔻",
    excited: "🔥",
  };
  return map[mood?.toLowerCase()] || "📋";
}

export function DailyBriefingCard({ briefing }: { briefing: DailyBriefing }) {
  return (
    <div className="mb-8 rounded-xl border bg-gradient-to-br from-card to-muted/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{moodEmoji(briefing.mood)}</span>
        <h2 className="text-lg font-semibold">Daily Briefing</h2>
        <span className="text-xs text-muted">{briefing.date}</span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-muted">{briefing.daily_briefing}</p>
      {briefing.category_summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(briefing.category_summary).map(([cat, summary]) => (
            <div key={cat} className="rounded-lg bg-background p-2.5 text-xs">
              <span className="block font-medium capitalize mb-0.5">{cat.replace("_", " ")}</span>
              <span className="text-muted">{summary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BriefingSkeleton() {
  return (
    <div className="mb-8 rounded-xl border bg-card p-5 animate-pulse">
      <div className="mb-3 h-5 w-48 rounded bg-muted" />
      <div className="mb-2 h-4 w-full rounded bg-muted" />
      <div className="mb-4 h-4 w-3/4 rounded bg-muted" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
