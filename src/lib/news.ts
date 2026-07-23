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
      .filter((f) => f.endsWith(".json") && f !== "metadata.json" && !f.includes("_briefing") && !f.includes("_geo") && !f.includes("_verification"))
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

  for (const [id, group] of clusterMap) {
    if (group.length < 2) {
      standalone.push(...group);
      clusterMap.delete(id);
    }
  }

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

// Bigram Jaccard similarity for title matching
function _bigramJaccard(a: string, b: string): number {
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2).toLowerCase());
    return set;
  };
  const ba = bigrams(a);
  const bb = bigrams(b);
  let intersection = 0;
  for (const bg of ba) if (bb.has(bg)) intersection++;
  const union = new Set([...ba, ...bb]).size;
  return union === 0 ? 0 : intersection / union;
}

export function semanticCluster(items: NewsItem[]): Map<string, NewsItem[]> {
  // Start with basic cluster_id grouping
  const clusters = groupByCluster(items);
  const singles: NewsItem[] = [];

  // Extract all single items for semantic matching
  for (const [key, group] of clusters) {
    if (key.startsWith("__single_")) {
      singles.push(group[0]);
    }
  }
  for (const key of [...clusters.keys()]) {
    if (key.startsWith("__single_")) clusters.delete(key);
  }

  // Match singles by keyword overlap + title similarity
  const matched = new Set<string>();
  for (let i = 0; i < singles.length; i++) {
    if (matched.has(singles[i].source_id)) continue;
    const group: NewsItem[] = [singles[i]];
    matched.add(singles[i].source_id);

    for (let j = i + 1; j < singles.length; j++) {
      if (matched.has(singles[j].source_id)) continue;
      const kwOverlap = (singles[i].keywords || []).filter(
        (k) => (singles[j].keywords || []).includes(k)
      ).length;
      const maxKw = Math.max((singles[i].keywords || []).length, (singles[j].keywords || []).length, 1);
      const kwScore = kwOverlap / maxKw;
      const titleScore = _bigramJaccard(singles[i].title, singles[j].title);

      if (kwScore > 0.6 || titleScore > 0.3) {
        group.push(singles[j]);
        matched.add(singles[j].source_id);
      }
    }

    if (group.length >= 2) {
      clusters.set(`semantic_${group.map((g) => g.source_id).join("_").slice(0, 40)}`, group);
    } else {
      clusters.set(`__single_${singles.indexOf(singles[i])}`, group);
    }
  }

  return clusters;
}

// Simple city → lat/lng lookup for geo visualization
const CITY_COORDS: Record<string, [number, number]> = {
  "san francisco": [37.7749, -122.4194],
  "new york": [40.7128, -74.0060],
  "london": [51.5074, -0.1278],
  "berlin": [52.5200, 13.4050],
  "tokyo": [35.6762, 139.6503],
  "beijing": [39.9042, 116.4074],
  "moscow": [55.7558, 37.6173],
  "paris": [48.8566, 2.3522],
  "bucharest": [44.4268, 26.1025],
  "cluj": [46.7712, 23.6236],
  "timisoara": [45.7489, 21.2087],
  "iasi": [47.1585, 27.6014],
  "brasov": [45.6427, 25.5887],
  "constanta": [44.1598, 28.6348],
  "craiova": [44.3302, 23.7949],
  "seattle": [47.6062, -122.3321],
  "austin": [30.2672, -97.7431],
  "boston": [42.3601, -71.0589],
  "chicago": [41.8781, -87.6298],
  "los angeles": [34.0522, -118.2437],
  "toronto": [43.6532, -79.3832],
  "vancouver": [49.2827, -123.1207],
  "sydney": [-33.8688, 151.2093],
  "singapore": [1.3521, 103.8198],
  "dubai": [25.2048, 55.2708],
  "bangalore": [12.9716, 77.5946],
  "amsterdam": [52.3676, 4.9041],
  "zurich": [47.3769, 8.5417],
  "stockholm": [59.3293, 18.0686],
  "helsinki": [60.1699, 24.9384],
  "oslo": [59.9139, 10.7522],
  "copenhagen": [55.6761, 12.5683],
  "dublin": [53.3498, -6.2603],
  "brussels": [50.8503, 4.3517],
  "madrid": [40.4168, -3.7038],
  "barcelona": [41.3874, 2.1686],
  "rome": [41.9028, 12.4964],
  "milan": [45.4642, 9.1900],
  "vienna": [48.2082, 16.3738],
  "warsaw": [52.2297, 21.0122],
  "prague": [50.0755, 14.4378],
  "budapest": [47.4979, 19.0402],
  "athens": [37.9838, 23.7275],
  "istanbul": [41.0082, 28.9784],
  "tel aviv": [32.0853, 34.7818],
  "mumbai": [19.0760, 72.8777],
  "shanghai": [31.2304, 121.4737],
  "hong kong": [22.3193, 114.1694],
  "seoul": [37.5665, 126.9780],
  "taipei": [25.0330, 121.5654],
  "melbourne": [-37.8136, 144.9631],
  "auckland": [-36.8485, 174.7633],
  "cape town": [-33.9249, 18.4241],
  "doha": [25.2854, 51.5310],
  "riyadh": [24.7136, 46.6753],
  "mexico city": [19.4326, -99.1332],
  "sao paulo": [-23.5505, -46.6333],
  "buenos aires": [-34.6037, -58.3816],
  "nairobi": [-1.2921, 36.8219],
  "lagos": [6.5244, 3.3792],
  "cairo": [30.0444, 31.2357],
  "johannesburg": [-26.2041, 28.0473],
};

export function readGeoLocations(days: number = 7): { source_id: string; title: string; city: string; country: string; lat: number; lng: number; category: string; score: number }[] {
  const dates = getAllDates().slice(0, days);
  const locations: any[] = [];
  for (const date of dates) {
    const items = readNewsFile(date);
    for (const item of items) {
      const geoTitle = (item.geo_title || "").toLowerCase().trim();
      if (!geoTitle) continue;
      for (const [city, coords] of Object.entries(CITY_COORDS)) {
        if (geoTitle.includes(city)) {
          locations.push({
            source_id: item.source_id,
            title: item.title,
            city,
            country: "",
            lat: coords[0],
            lng: coords[1],
            category: item.category,
            score: item.score,
          });
          break;
        }
      }
    }
  }
  return locations;
}

export function readVerification(sourceId: string): { verification_status: string; sources_count: number; sources: string[] } | null {
  const dates = getAllDates().slice(0, 3);
  for (const date of dates) {
    try {
      const vf = path.join(process.cwd(), "public", "data", "news", `${date}_verification.json`);
      if (!fs.existsSync(vf)) continue;
      const data = JSON.parse(fs.readFileSync(vf, "utf-8"));
      if (data.results?.[sourceId]) return data.results[sourceId];
    } catch { continue; }
  }
  return null;
}

export function readGraph(): { nodes: any[]; edges: any[]; stats: any } | null {
  try {
    const graphPath = path.join(process.cwd(), "public", "data", "news_graph.json");
    if (!fs.existsSync(graphPath)) return null;
    return JSON.parse(fs.readFileSync(graphPath, "utf-8"));
  } catch {
    return null;
  }
}

export function findNewsItem(sourceId: string): NewsItem | null {
  const dates = getAllDates();
  for (const date of dates.slice(0, 30)) {
    const items = readNewsFile(date);
    const found = items.find((i) => i.source_id === sourceId);
    if (found) return found;
  }
  return null;
}

export function generateComparison(items: NewsItem[]): { consensus: string; differences: string } {
  const allSummaries = items.map((i) => i.summary_detailed || i.summary || "").filter(Boolean);
  if (allSummaries.length < 2) return { consensus: allSummaries[0] || "", differences: "" };

  const words = allSummaries.map((s) => new Set(s.toLowerCase().split(/\s+/)));
  const common = [...words[0]].filter((w) => words.every((ws) => ws.has(w))).slice(0, 50);
  const uniquePerSource = items.map((item, i) => {
    const srcWords = new Set((item.summary_detailed || item.summary || "").toLowerCase().split(/\s+/));
    const unique = [...srcWords].filter((w) => !common.includes(w) && w.length > 4).slice(0, 30);
    return { source: item.source_name, unique: unique.join(", ") };
  });

  return {
    consensus: `All ${items.length} sources agree on: ${common.slice(0, 20).join(", ")}...`,
    differences: uniquePerSource
      .filter((u) => u.unique)
      .map((u) => `${u.source}: ${u.unique}`)
      .join(" | "),
  };
}
