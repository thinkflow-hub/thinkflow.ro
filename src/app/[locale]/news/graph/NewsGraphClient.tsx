"use client";

import { useRouter } from "@/i18n/navigation";
import { NewsGraph } from "@/components/news/NewsGraph";
import type { NewsItem } from "@/lib/news-types";

interface GraphNode {
  id: string; label: string; type: "article" | "entity";
  weight: number; category: string; source: string;
}

interface GraphEdge { source: string; target: string; weight: number }

export function NewsGraphClient({ graph }: { graph: { nodes: GraphNode[]; edges: GraphEdge[]; stats: any } }) {
  const router = useRouter();

  function handleNodeClick(node: GraphNode) {
    if (node.type === "article") {
      const sourceId = node.id.replace("article:", "");
      router.push(`/news/article/${sourceId}`);
    }
  }

  return <NewsGraph graph={graph} onNodeClick={handleNodeClick} />;
}
