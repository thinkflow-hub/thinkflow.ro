import { NextRequest, NextResponse } from "next/server";
import { readNewsFile, getAllDates } from "@/lib/news";
import type { Category } from "@/lib/news-types";

const SITE_URL = "https://thinkflow.ro";
const FEED_TITLE = "ThinkFlow News";
const FEED_DESC = "Curated AI, cloud, DevOps, and web development news";
const MAX_ITEMS = 50;
const MAX_DAYS = 7;

const VALID_CATEGORIES = new Set<string>([
  "trending", "community", "open_source", "releases",
  "ai_labs", "research", "newsletters", "industry",
]);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(iso: string): string {
  const d = new Date(iso);
  return d.toUTCString();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const isAll = category === "all";

  if (!isAll && !VALID_CATEGORIES.has(category)) {
    return new NextResponse(`Unknown category: ${category}`, { status: 404 });
  }

  const dates = getAllDates().slice(0, MAX_DAYS);
  const seen = new Set<string>();
  const items: Array<{
    title: string;
    url: string;
    description: string;
    published: string;
    source_id: string;
  }> = [];

  for (const date of dates) {
    const newsItems = readNewsFile(date);
    for (const item of newsItems) {
      if (items.length >= MAX_ITEMS) break;
      if (seen.has(item.source_id)) continue;
      if (!isAll && item.category !== category) continue;

      items.push({
        title: item.title,
        url: item.url,
        description: item.summary || item.description || "",
        published: item.published,
        source_id: item.source_id,
      });
      seen.add(item.source_id);
    }
    if (items.length >= MAX_ITEMS) break;
  }

  const now = new Date().toUTCString();

  const channelLink = isAll
    ? `${SITE_URL}/news`
    : `${SITE_URL}/news?category=${category}`;

  const feedLink = isAll
    ? `${SITE_URL}/api/news/feed/all`
    : `${SITE_URL}/api/news/feed/${category}`;

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${toRssDate(item.published)}</pubDate>
      <guid isPermaLink="false">${escapeXml(item.source_id)}</guid>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedLink)}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
