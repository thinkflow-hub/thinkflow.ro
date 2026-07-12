import { NextRequest, NextResponse } from "next/server";
import { readNewsFile, getAllDates } from "@/lib/news";
import type { NewsItem } from "@/lib/news-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const daysParam = searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 14;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query too short (min 2 chars)" }, { status: 400 });
  }

  const allDates = getAllDates();
  const searchDates = allDates.slice(0, Math.min(days, allDates.length));
  const results: NewsItem[] = [];
  const seen = new Set<string>();

  for (const date of searchDates) {
    const items = readNewsFile(date);
    for (const item of items) {
      if (results.length >= limit) break;
      if (seen.has(item.source_id)) continue;

      const searchable = [
        item.title,
        item.description,
        item.summary,
        ...(item.keywords || []),
        item.source_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchable.includes(q)) {
        results.push(item);
        seen.add(item.source_id);
      }
    }
    if (results.length >= limit) break;
  }

  return NextResponse.json({
    query: q,
    total: results.length,
    days_searched: searchDates.length,
    results: results.sort((a, b) => (b.score || 0) - (a.score || 0)),
  });
}
