import fs from "fs";
import path from "path";
import type { NewsItem, NewsData, Metadata, Category, DailyBriefing, GeoMetadata } from "./news-types";

const DATA_DIR = path.join(process.cwd(), "public", "data", "news");

export function readNewsFile(date: string): NewsItem[] {
  try {
    const filePath = path.join(DATA_DIR, `${date}.json`);
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    const data: NewsData = JSON.parse(raw);
    return data.items || [];
  } catch {
    return [];
  }
}

export function readNewsData(date: string): NewsData | null {
  try {
    const filePath = path.join(DATA_DIR, `${date}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readDailyBriefing(date: string): DailyBriefing | null {
  try {
    const filePath = path.join(DATA_DIR, `${date}_briefing.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readGeoMetadata(date: string): GeoMetadata | null {
  try {
    const filePath = path.join(DATA_DIR, `${date}_geo.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readMetadata(): Metadata | null {
  try {
    const filePath = path.join(DATA_DIR, "metadata.json");
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAllDates(): string[] {
  const meta = readMetadata();
  if (meta?.dates?.length) return meta.dates;
  try {
    if (!fs.existsSync(DATA_DIR)) return [];
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter((f) => f.endsWith(".json") && f !== "metadata.json" && !f.includes("_briefing") && !f.includes("_geo"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function getLatestDate(): string | null {
  const dates = getAllDates();
  return dates.length > 0 ? dates[0] : null;
}

export function getAllTopics(): string[] {
  const meta = readMetadata();
  const dates = meta?.dates || [];
  const topics = new Set<string>();
  for (const date of dates.slice(0, 7)) {
    const geo = readGeoMetadata(date);
    if (geo?.topics) {
      geo.topics.forEach((t) => topics.add(t));
    }
  }
  return Array.from(topics).sort();
}

export function groupByCluster(items: NewsItem[]): Map<string, NewsItem[]> {
  const clusterMap = new Map<string, NewsItem[]>();
  const standalone: NewsItem[] = [];

  for (const item of items) {
    if (item.cluster_id) {
      const group = clusterMap.get(item.cluster_id);
      if (group) group.push(item);
      else clusterMap.set(item.cluster_id, [item]);
    } else {
      standalone.push(item);
    }
  }

  // Filter out singleton clusters (no actual grouping needed)
  for (const [id, group] of clusterMap) {
    if (group.length < 2) {
      standalone.push(...group);
      clusterMap.delete(id);
    }
  }

  // Assign a virtual id for non-clustered items so we can render them uniformly
  const result = new Map<string, NewsItem[]>();
  let virtualId = 0;
  for (const item of standalone) {
    result.set(`__single_${virtualId++}`, [item]);
  }
  for (const [id, group] of clusterMap) {
    result.set(`cluster_${id}`, group);
  }
  return result;
}
