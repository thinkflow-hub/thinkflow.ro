import type { NewsItem } from "./news-types";

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

export function semanticCluster(items: NewsItem[]): Map<string, NewsItem[]> {
  const clusters = groupByCluster(items);
  const singles: NewsItem[] = [];

  for (const [key, group] of clusters) {
    if (key.startsWith("__single_")) {
      singles.push(group[0]);
    }
  }
  for (const key of [...clusters.keys()]) {
    if (key.startsWith("__single_")) clusters.delete(key);
  }

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
