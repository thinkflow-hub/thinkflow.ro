"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { NewsItem } from "@/lib/news-types";

interface GraphNode {
  id: string;
  label: string;
  type: "article" | "entity";
  weight: number;
  category: string;
  source: string;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

interface Props {
  graph: { nodes: GraphNode[]; edges: GraphEdge[]; stats: any };
  onNodeClick?: (node: GraphNode) => void;
}

// Simple force layout in pure JS
function forceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
): { x: number; y: number }[] {
  const positions = nodes.map(() => ({
    x: width / 2 + (Math.random() - 0.5) * width * 0.5,
    y: height / 2 + (Math.random() - 0.5) * height * 0.5,
  }));
  const vx = nodes.map(() => 0);
  const vy = nodes.map(() => 0);

  const REPULSION = 800;
  const ATTRACTION = 0.005;
  const DAMPING = 0.9;
  const ITERATIONS = 60;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion: all nodes push each other
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = REPULSION / (dist * dist);
        vx[i] -= (force * dx) / dist;
        vy[i] -= (force * dy) / dist;
        vx[j] += (force * dx) / dist;
        vy[j] += (force * dy) / dist;
      }
    }

    // Attraction: edges pull connected nodes together
    for (const edge of edges) {
      const si = nodes.findIndex((n) => n.id === edge.source);
      const ti = nodes.findIndex((n) => n.id === edge.target);
      if (si === -1 || ti === -1) continue;
      const dx = positions[ti].x - positions[si].x;
      const dy = positions[ti].y - positions[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = ATTRACTION * dist;
      vx[si] += (force * dx) / dist;
      vy[si] += (force * dy) / dist;
      vx[ti] -= (force * dx) / dist;
      vy[ti] -= (force * dy) / dist;
    }

    // Center gravity
    for (let i = 0; i < nodes.length; i++) {
      vx[i] += (width / 2 - positions[i].x) * 0.001;
      vy[i] += (height / 2 - positions[i].y) * 0.001;
    }

    // Apply velocity
    for (let i = 0; i < nodes.length; i++) {
      vx[i] *= DAMPING;
      vy[i] *= DAMPING;
      positions[i].x += vx[i];
      positions[i].y += vy[i];
      positions[i].x = Math.max(20, Math.min(width - 20, positions[i].x));
      positions[i].y = Math.max(20, Math.min(height - 20, positions[i].y));
    }
  }

  return positions;
}

const CATEGORY_COLORS: Record<string, string> = {
  trending: "#f59e0b",
  community: "#ef4444",
  open_source: "#6b7280",
  releases: "#22c55e",
  ai_labs: "#8b5cf6",
  research: "#06b6d4",
  newsletters: "#ec4899",
  industry: "#64748b",
};

export function NewsGraph({ graph, onNodeClick }: Props) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(400, containerRef.current.clientHeight),
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const layout = useMemo(
    () => forceLayout(graph.nodes, graph.edges, dimensions.width, dimensions.height),
    [graph, dimensions]
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graph.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graph.nodes]);

  const maxWeight = Math.max(...graph.nodes.map((n) => n.weight), 1);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      <svg width={dimensions.width} height={dimensions.height} className="bg-card rounded-xl">
        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const si = graph.nodes.findIndex((n) => n.id === edge.source);
          const ti = graph.nodes.findIndex((n) => n.id === edge.target);
          if (si === -1 || ti === -1) return null;
          return (
            <line
              key={`e-${i}`}
              x1={layout[si].x}
              y1={layout[si].y}
              x2={layout[ti].x}
              y2={layout[ti].y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Nodes */}
        {graph.nodes.map((node, i) => {
          const isArticle = node.type === "article";
          const r = isArticle ? 4 + (node.weight / maxWeight) * 8 : 3 + (node.weight / maxWeight) * 5;
          const color = CATEGORY_COLORS[node.category] || "#94a3b8";
          const isHovered = hoveredNode === node.id;

          return (
            <g key={node.id}>
              <circle
                cx={layout[i].x}
                cy={layout[i].y}
                r={isHovered ? r + 3 : r}
                fill={isArticle ? color : "#94a3b8"}
                opacity={isArticle ? 0.9 : 0.5}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick?.(node)}
              />
              {isHovered && (
                <text
                  x={layout[i].x}
                  y={layout[i].y - r - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  className="text-muted"
                >
                  {node.label.slice(0, 30)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredNode && nodeMap.has(hoveredNode) && (
        <div className="mt-2 rounded-lg border bg-card p-2 text-xs">
          <p className="font-medium">{nodeMap.get(hoveredNode)?.label}</p>
          <p className="text-muted">
            {nodeMap.get(hoveredNode)?.type === "article" ? "Article" : "Topic"}
            {nodeMap.get(hoveredNode)?.source && ` · ${nodeMap.get(hoveredNode)?.source}`}
          </p>
        </div>
      )}
    </div>
  );
}
